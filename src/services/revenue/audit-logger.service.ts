import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

export interface AuditLogEntry {
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  ip?: string;
  timestamp?: Date;
  errorMessage?: string;
}

export interface AuditLogResponse {
  id: string;
  companyId: string;
  action: string;
  entity: string;
  entityId: string;
  status: string;
  timestamp: Date;
  changes?: Record<string, any>;
}

export class AuditLogger {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async log(entry: AuditLogEntry): Promise<AuditLogResponse> {
    const now = new Date();

    try {
      // Criar entrada de auditoria no banco
      const auditEntry = await prisma.auditLog.create({
        data: {
          companyId: entry.companyId,
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          changes: entry.changes,
          status: entry.status,
          ip: entry.ip || 'unknown',
          timestamp: entry.timestamp || now,
          errorMessage: entry.errorMessage,
        },
      });

      // Log estruturado
      this.logger.info(`Audit: ${entry.action}`, {
        companyId: entry.companyId,
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        status: entry.status,
        timestamp: now.toISOString(),
      });

      return {
        id: auditEntry.id,
        companyId: auditEntry.companyId,
        action: auditEntry.action,
        entity: auditEntry.entity,
        entityId: auditEntry.entityId,
        status: auditEntry.status,
        timestamp: auditEntry.timestamp,
        changes: auditEntry.changes,
      };
    } catch (error) {
      this.logger.error(`Audit logging failed: ${entry.action}`, {
        companyId: entry.companyId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  async getCompanyAuditLog(companyId: string, limit: number = 50, offset: number = 0) {
    return prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getEntityAuditTrail(companyId: string, entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { companyId, entity, entityId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getActionStats(companyId: string, startDate: Date, endDate: Date) {
    const logs = await prisma.auditLog.findMany({
      where: {
        companyId,
        timestamp: { gte: startDate, lte: endDate },
      },
    });

    const stats = new Map<string, number>();
    logs.forEach((log) => {
      stats.set(log.action, (stats.get(log.action) || 0) + 1);
    });

    return Object.fromEntries(stats);
  }

  async getFailedOperations(companyId: string, limit: number = 20) {
    return prisma.auditLog.findMany({
      where: { companyId, status: 'FAILURE' },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getChangeHistory(companyId: string, entity: string, entityId: string) {
    const logs = await this.getEntityAuditTrail(companyId, entity, entityId);

    return logs.map((log) => ({
      action: log.action,
      timestamp: log.timestamp,
      changes: log.changes,
      status: log.status,
    }));
  }

  async generateComplianceReport(companyId: string, startDate: Date, endDate: Date) {
    const logs = await prisma.auditLog.findMany({
      where: {
        companyId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    const actions = new Map<string, any[]>();
    logs.forEach((log) => {
      if (!actions.has(log.action)) {
        actions.set(log.action, []);
      }
      actions.get(log.action)!.push({
        entityId: log.entityId,
        timestamp: log.timestamp,
        status: log.status,
        userId: log.userId,
      });
    });

    return {
      companyId,
      period: { startDate, endDate },
      totalOperations: logs.length,
      byAction: Object.fromEntries(
        Array.from(actions.entries()).map(([action, entries]) => [
          action,
          { count: entries.length, successRate: this.calculateSuccessRate(entries) },
        ])
      ),
      failedOperations: logs.filter((l) => l.status === 'FAILURE').length,
      generatedAt: new Date(),
    };
  }

  private calculateSuccessRate(entries: any[]): number {
    if (entries.length === 0) return 0;
    const successful = entries.filter((e) => e.status === 'SUCCESS').length;
    return (successful / entries.length) * 100;
  }
}
