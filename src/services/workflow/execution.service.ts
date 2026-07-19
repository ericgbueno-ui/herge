import { Logger } from '@/lib/logger';
import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';
import { getQueueManager, QueueType } from '@/core/integrations/queue/queue-manager';

export class ExecutionService {
  private repository = new WorkflowRepository();
  private queueManager = getQueueManager();

  constructor(private logger: Logger) {}

  async createExecution(params: {
    workflowId: string;
    companyId: string;
    triggerType: string;
    triggeredBy?: string;
    triggerData?: Record<string, any>;
  }) {
    return this.repository.createExecution({
      workflowId: params.workflowId,
      companyId: params.companyId,
      status: 'PENDING',
      triggerType: params.triggerType,
      triggeredBy: params.triggeredBy,
      triggerData: params.triggerData,
    });
  }

  async enqueueExecution(executionId: string, workflowId: string, companyId: string, triggerData?: Record<string, any>) {
    const job = await this.queueManager.enqueue({
      type: QueueType.WORKFLOW,
      provider: 'workflow-engine',
      connectionId: workflowId,
      companyId,
      data: {
        executionId,
        workflowId,
        triggerData: triggerData || null,
      },
      priority: 10,
      attempts: 3,
    });

    this.logger.info('Workflow execution enqueued', { executionId, workflowId, companyId, jobId: job.id });
    return job;
  }

  async getExecution(executionId: string, companyId: string) {
    return this.repository.findExecutionById(executionId, companyId);
  }

  async listExecutions(companyId: string, workflowId?: string, status?: string, limit?: number) {
    return this.repository.listExecutions(companyId, workflowId, status, limit);
  }

  async markAsRunning(executionId: string, companyId: string) {
    return this.repository.updateExecution(executionId, companyId, {
      status: 'RUNNING',
      startedAt: new Date(),
    });
  }

  async markAsSuccess(executionId: string, companyId: string, result?: Record<string, any>) {
    return this.repository.updateExecution(executionId, companyId, {
      status: 'SUCCESS',
      completedAt: new Date(),
      durationMs: undefined,
      result: result || null,
    });
  }

  async markAsFailed(executionId: string, companyId: string, error: string) {
    return this.repository.updateExecution(executionId, companyId, {
      status: 'FAILED',
      completedAt: new Date(),
      result: { error },
    });
  }

  async addExecutionLog(executionId: string, companyId: string, eventType: string, message?: string, payload?: Record<string, any>) {
    return this.repository.createExecutionLog({
      executionId,
      companyId,
      eventType,
      message,
      payload: payload || null,
    });
  }
}
