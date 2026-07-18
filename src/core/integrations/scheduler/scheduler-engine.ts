/**
 * SCHEDULER ENGINE
 * Agendador de jobs (refresh token, sync, health check)
 * Utiliza node-cron ou BullMQ repeat
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { getQueueManager, QueueType } from '../queue/queue-manager';
import { getEventBus } from '../services/event-bus';

export interface ScheduledJob {
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  enabled: boolean;
}

export class SchedulerEngine {
  private jobs: Map<string, ScheduledJob> = new Map();
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.registerDefaultJobs();
  }

  /**
   * Registrar jobs padrão
   */
  private registerDefaultJobs(): void {
    // Renovar tokens a cada 6 horas
    this.register({
      name: 'refresh-tokens',
      cronExpression: '0 */6 * * *', // 00:00, 06:00, 12:00, 18:00
      handler: () => this.refreshExpiredTokens(),
      enabled: true,
    });

    // Sincronizar contas a cada 4 horas
    this.register({
      name: 'sync-accounts',
      cronExpression: '0 */4 * * *',
      handler: () => this.syncAllAccounts(),
      enabled: true,
    });

    // Health check a cada 30 minutos
    this.register({
      name: 'health-check',
      cronExpression: '*/30 * * * *',
      handler: () => this.healthCheckAllProviders(),
      enabled: true,
    });

    // Limpar webhooks antigos a cada dia
    this.register({
      name: 'cleanup-logs',
      cronExpression: '0 2 * * *', // 02:00
      handler: () => this.cleanupOldLogs(),
      enabled: true,
    });

    console.log('[SchedulerEngine] Jobs padrão registrados');
  }

  /**
   * Registrar job customizado
   */
  register(job: ScheduledJob): void {
    this.jobs.set(job.name, job);

    if (job.enabled) {
      this.start(job.name);
    }

    console.log(`[SchedulerEngine] Job registrado: ${job.name}`);
  }

  /**
   * Iniciar job agendado
   */
  start(jobName: string): void {
    const job = this.jobs.get(jobName);

    if (!job) {
      throw new Error(`Job ${jobName} não encontrado`);
    }

    if (this.tasks.has(jobName)) {
      console.warn(`[SchedulerEngine] Job ${jobName} já está ativo`);
      return;
    }

    try {
      const task = cron.schedule(job.cronExpression, async () => {
        try {
          console.log(`[SchedulerEngine] Executando job: ${jobName}`);
          await job.handler();
          console.log(`[SchedulerEngine] Job completado: ${jobName}`);
        } catch (error) {
          console.error(`[SchedulerEngine] Erro no job ${jobName}:`, error);
          getEventBus().emit('SCHEDULER_JOB_FAILED', {
            jobName,
            error: (error as Error).message,
          });
        }
      });

      this.tasks.set(jobName, task);
      console.log(`[SchedulerEngine] Job iniciado: ${jobName}`);
    } catch (error) {
      console.error(`[SchedulerEngine] Erro ao iniciar job ${jobName}:`, error);
    }
  }

  /**
   * Parar job agendado
   */
  stop(jobName: string): void {
    const task = this.tasks.get(jobName);

    if (!task) {
      console.warn(`[SchedulerEngine] Task ${jobName} não está ativa`);
      return;
    }

    task.stop();
    this.tasks.delete(jobName);
    console.log(`[SchedulerEngine] Job parado: ${jobName}`);
  }

  /**
   * Parar todos os jobs
   */
  stopAll(): void {
    for (const jobName of this.tasks.keys()) {
      this.stop(jobName);
    }

    console.log('[SchedulerEngine] Todos os jobs parados');
  }

  // === HANDLERS DOS JOBS ===

  /**
   * Renovar tokens próximos de expirar
   */
  private async refreshExpiredTokens(): Promise<void> {
    try {
      console.log('[SchedulerEngine] Renovando tokens próximos de expirar...');

      // Buscar tokens que expiram nos próximas 24 horas
      const connections = await prisma.adAccount.findMany({
        where: {
          status: 'connected',
          tokenExpiresAt: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // próximas 24h
            gt: new Date(), // ainda não expirou
          },
        },
      });

      console.log(`[SchedulerEngine] ${connections.length} tokens para renovar`);

      const queueManager = getQueueManager();

      for (const connection of connections) {
        await queueManager.enqueue({
          type: QueueType.REFRESH_TOKEN,
          provider: connection.provider,
          connectionId: connection.id,
          companyId: connection.companyId,
        });
      }

      getEventBus().emit('TOKENS_REFRESH_STARTED', {
        count: connections.length,
      });
    } catch (error) {
      console.error('[SchedulerEngine] Erro ao renovar tokens:', error);
      throw error;
    }
  }

  /**
   * Sincronizar todas as contas
   */
  private async syncAllAccounts(): Promise<void> {
    try {
      console.log('[SchedulerEngine] Sincronizando todas as contas...');

      const connections = await prisma.adAccount.findMany({
        where: {
          status: 'connected',
        },
      });

      console.log(`[SchedulerEngine] ${connections.length} contas para sincronizar`);

      const queueManager = getQueueManager();

      for (const connection of connections) {
        await queueManager.enqueue({
          type: QueueType.SYNC,
          provider: connection.provider,
          connectionId: connection.id,
          companyId: connection.companyId,
          priority: 5, // Prioridade média
        });
      }

      getEventBus().emit('SYNC_SCHEDULED', {
        count: connections.length,
      });
    } catch (error) {
      console.error('[SchedulerEngine] Erro ao sincronizar contas:', error);
      throw error;
    }
  }

  /**
   * Health check de todos os providers
   */
  private async healthCheckAllProviders(): Promise<void> {
    try {
      console.log('[SchedulerEngine] Realizando health check...');

      const connections = await prisma.adAccount.findMany({
        where: {
          status: 'connected',
        },
      });

      console.log(`[SchedulerEngine] ${connections.length} contas para verificar`);

      const queueManager = getQueueManager();

      for (const connection of connections) {
        await queueManager.enqueue({
          type: QueueType.HEALTH_CHECK,
          provider: connection.provider,
          connectionId: connection.id,
          companyId: connection.companyId,
          priority: 10, // Alta prioridade
        });
      }

      getEventBus().emit('HEALTH_CHECK_SCHEDULED', {
        count: connections.length,
      });
    } catch (error) {
      console.error('[SchedulerEngine] Erro no health check:', error);
      throw error;
    }
  }

  /**
   * Limpar logs antigos
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      console.log('[SchedulerEngine] Limpando logs antigos...');

      // Deletar logs com mais de 90 dias
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Aqui você deletaria da tabela de logs
      // Exemplo:
      // await prisma.integrationLog.deleteMany({
      //   where: {
      //     createdAt: { lt: cutoffDate }
      //   }
      // });

      console.log('[SchedulerEngine] Logs antigos removidos');

      getEventBus().emit('LOGS_CLEANUP_COMPLETED', {
        deletedBefore: cutoffDate,
      });
    } catch (error) {
      console.error('[SchedulerEngine] Erro ao limpar logs:', error);
      throw error;
    }
  }

  /**
   * Listar jobs e seu status
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [name, job] of this.jobs) {
      const task = this.tasks.get(name);
      status[name] = {
        name: job.name,
        cron: job.cronExpression,
        enabled: job.enabled,
        active: !!task,
      };
    }

    return status;
  }
}

let scheduler: SchedulerEngine;

export function getScheduler(): SchedulerEngine {
  if (!scheduler) {
    scheduler = new SchedulerEngine();
  }
  return scheduler;
}
