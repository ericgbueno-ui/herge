import { Prisma, Workflow, WorkflowTrigger, WorkflowAction, WorkflowExecution, WorkflowExecutionLog, WorkflowTemplate } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class WorkflowRepository {
  async createWorkflow(data: {
    companyId: string;
    name: string;
    description?: string;
    status: string;
    triggerType: string;
    config?: Prisma.JsonValue;
    metadata?: Prisma.JsonValue;
    version?: number;
  }): Promise<Workflow> {
    return prisma.workflow.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        status: data.status,
        triggerType: data.triggerType,
        config: data.config,
        metadata: data.metadata,
        version: data.version || 1,
      },
    });
  }

  async updateWorkflow(workflowId: string, companyId: string, updates: Partial<{ name: string; description: string; status: string; triggerType: string; config: Prisma.JsonValue; metadata: Prisma.JsonValue; version: number; }>): Promise<Workflow | null> {
    const workflow = await this.findWorkflowById(workflowId, companyId);
    if (!workflow) {
      return null;
    }

    return prisma.workflow.update({
      where: { id: workflowId },
      data: {
        ...updates,
        version: updates.version ?? workflow.version,
      },
    });
  }

  async findWorkflowById(workflowId: string, companyId: string): Promise<Workflow | null> {
    return prisma.workflow.findFirst({ where: { id: workflowId, companyId } });
  }

  async listWorkflows(companyId: string, status?: string): Promise<Workflow[]> {
    return prisma.workflow.findMany({
      where: { companyId, status: status || undefined },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteWorkflow(workflowId: string, companyId: string): Promise<void> {
    await prisma.workflow.deleteMany({ where: { id: workflowId, companyId } });
  }

  async createTrigger(data: {
    workflowId: string;
    triggerType: string;
    config: Prisma.JsonValue;
  }): Promise<WorkflowTrigger> {
    return prisma.workflowTrigger.create({
      data,
    });
  }

  async updateTrigger(triggerId: string, workflowId: string, companyId: string, updates: Partial<{ config: Prisma.JsonValue; isActive: boolean; lastTriggeredAt: Date }>): Promise<WorkflowTrigger | null> {
    const trigger = await this.findTriggerById(triggerId, workflowId, companyId);
    if (!trigger) return null;

    return prisma.workflowTrigger.update({
      where: { id: triggerId },
      data: updates,
    });
  }

  async findTriggerById(triggerId: string, workflowId: string, companyId: string): Promise<WorkflowTrigger | null> {
    return prisma.workflowTrigger.findFirst({
      where: { id: triggerId, workflowId, workflow: { companyId } },
    });
  }

  async listTriggers(workflowId: string, companyId: string): Promise<WorkflowTrigger[]> {
    return prisma.workflowTrigger.findMany({
      where: { workflowId, workflow: { companyId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAction(data: {
    workflowId: string;
    actionType: string;
    config: Prisma.JsonValue;
    order?: number;
  }): Promise<WorkflowAction> {
    return prisma.workflowAction.create({
      data,
    });
  }

  async updateAction(actionId: string, workflowId: string, companyId: string, updates: Partial<{ config: Prisma.JsonValue; order: number; isActive: boolean }>): Promise<WorkflowAction | null> {
    const action = await this.findActionById(actionId, workflowId, companyId);
    if (!action) return null;

    return prisma.workflowAction.update({
      where: { id: actionId },
      data: updates,
    });
  }

  async findActionById(actionId: string, workflowId: string, companyId: string): Promise<WorkflowAction | null> {
    return prisma.workflowAction.findFirst({
      where: { id: actionId, workflowId, workflow: { companyId } },
    });
  }

  async listActions(workflowId: string, companyId: string): Promise<WorkflowAction[]> {
    return prisma.workflowAction.findMany({
      where: { workflowId, workflow: { companyId } },
      orderBy: { order: 'asc' },
    });
  }

  async createExecution(data: {
    workflowId: string;
    companyId: string;
    status: string;
    triggerType: string;
    triggeredBy?: string | null;
    triggerData?: Prisma.JsonValue;
  }): Promise<WorkflowExecution> {
    return prisma.workflowExecution.create({
      data,
    });
  }

  async updateExecution(executionId: string, companyId: string, updates: Partial<{ status: string; startedAt: Date | null; completedAt: Date | null; durationMs: number | null; result: Prisma.JsonValue | null; }>): Promise<WorkflowExecution | null> {
    const execution = await this.findExecutionById(executionId, companyId);
    if (!execution) return null;

    return prisma.workflowExecution.update({
      where: { id: executionId },
      data: updates,
    });
  }

  async findExecutionById(executionId: string, companyId: string): Promise<WorkflowExecution | null> {
    return prisma.workflowExecution.findFirst({ where: { id: executionId, companyId } });
  }

  async listExecutions(companyId: string, workflowId?: string, status?: string, limit?: number): Promise<WorkflowExecution[]> {
    return prisma.workflowExecution.findMany({
      where: {
        companyId,
        workflowId: workflowId || undefined,
        status: status || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createExecutionLog(data: {
    executionId: string;
    companyId: string;
    eventType: string;
    message?: string;
    payload?: Prisma.JsonValue;
  }): Promise<WorkflowExecutionLog> {
    return prisma.workflowExecutionLog.create({ data });
  }

  async listExecutionLogs(executionId: string, companyId: string): Promise<WorkflowExecutionLog[]> {
    return prisma.workflowExecutionLog.findMany({
      where: { executionId, companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTemplate(data: {
    companyId: string;
    name: string;
    description?: string;
    version?: number;
    triggerType: string;
    category?: string;
    templateData: Prisma.JsonValue;
    isActive?: boolean;
  }): Promise<WorkflowTemplate> {
    return prisma.workflowTemplate.create({ data });
  }

  async updateTemplate(templateId: string, companyId: string, updates: Partial<{ name: string; description: string; version: number; triggerType: string; category: string; templateData: Prisma.JsonValue; isActive: boolean }>): Promise<WorkflowTemplate | null> {
    const template = await this.findTemplateById(templateId, companyId);
    if (!template) return null;
    return prisma.workflowTemplate.update({ where: { id: templateId }, data: updates });
  }

  async findTemplateById(templateId: string, companyId: string): Promise<WorkflowTemplate | null> {
    return prisma.workflowTemplate.findFirst({ where: { id: templateId, companyId } });
  }

  async listTemplates(companyId: string, isActive?: boolean): Promise<WorkflowTemplate[]> {
    return prisma.workflowTemplate.findMany({
      where: { companyId, isActive: isActive ?? undefined },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findActiveWorkflowsByEvent(eventName: string): Promise<(Workflow & { triggers: WorkflowTrigger[] })[]> {
    const workflows = await prisma.workflow.findMany({
      where: {
        status: 'ACTIVE',
        triggers: { some: { triggerType: 'EVENT', isActive: true } },
      },
      include: { triggers: true },
    });

    return workflows.filter((workflow) =>
      workflow.triggers.some(
        (trigger) =>
          trigger.triggerType === 'EVENT' &&
          trigger.isActive &&
          (trigger.config as any)?.eventName === eventName
      )
    );
  }
}
