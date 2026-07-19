import { getQueueManager, QueueType } from '@/core/integrations/queue/queue-manager';
import { getEventBus } from '@/core/events/event-bus';
import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';
import { Logger } from '@/lib/logger';

const logger = new Logger();
const repository = new WorkflowRepository();
const eventBus = getEventBus();
const queueManager = getQueueManager();

const WORKFLOW_QUEUE = QueueType.WORKFLOW;

export class WorkflowEngine {
  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.registerWorkflowQueue();
    await this.registerEventListeners();
    logger.info('WorkflowEngine initialized');
  }

  private async registerWorkflowQueue() {
    await queueManager.onProcess(WORKFLOW_QUEUE, async (job) => {
      const queueMeta = job.data;
      const payload = queueMeta.data as any;
      const executionId = payload?.executionId;
      const workflowId = payload?.workflowId || queueMeta.connectionId;
      const triggerData = payload?.triggerData;
      const companyId = queueMeta.companyId;

      logger.info('Processing workflow job', { executionId, workflowId, triggerData, companyId });

      const workflow = await repository.findWorkflowById(workflowId, companyId);
      if (!workflow) {
        logger.error('Workflow not found for execution', { workflowId, companyId: job.data.companyId });
        return;
      }

      // Mark execution as running and log start
      await repository.updateExecution(executionId, companyId, {
        status: 'RUNNING',
        startedAt: new Date(),
      });

      const actions = await repository.listActions(workflowId, companyId);
      const sortedActions = actions.filter((action) => action.isActive).sort((a, b) => a.order - b.order);
      const executionLogs: any[] = [];
      let result: any = { success: true, steps: [] };

      try {
        for (const action of sortedActions) {
          const actionResult = await this.executeAction(workflow, action, triggerData);
          executionLogs.push({ actionId: action.id, actionType: action.actionType, result: actionResult });
          await repository.createExecutionLog({
            executionId,
            companyId: job.data.companyId,
            eventType: 'ACTION_EXECUTED',
            message: `Action executed: ${action.actionType}`,
            payload: { actionId: action.id, result: actionResult },
          });
          result.steps.push({ actionId: action.id, actionType: action.actionType, result: actionResult });
        }

        await repository.updateExecution(executionId, job.data.companyId, {
          status: 'SUCCESS',
          completedAt: new Date(),
          durationMs: 0,
          result,
        });

        eventBus.emit('workflow:execution:completed', {
          executionId,
          workflowId,
          companyId: job.data.companyId,
          result,
        });
      } catch (error) {
        const errorMessage = (error as Error).message;
        await repository.updateExecution(executionId, job.data.companyId, {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs: 0,
          result: { error: errorMessage },
        });

        await repository.createExecutionLog({
          executionId,
          companyId: job.data.companyId,
          eventType: 'ACTION_FAILED',
          message: errorMessage,
          payload: { workflowId, triggerData },
        });

        eventBus.emit('workflow:execution:failed', {
          executionId,
          workflowId,
          companyId: job.data.companyId,
          error: errorMessage,
        });
      }
    });
  }

  private async executeAction(workflow: any, action: any, triggerData: any) {
    switch (action.actionType) {
      case 'NOTIFICATION':
        return this.executeNotification(action.config, triggerData);
      case 'TASK':
        return this.executeTask(action.config, triggerData);
      case 'RECORD_UPDATE':
        return this.executeRecordUpdate(action.config, triggerData);
      case 'WEBHOOK':
        return this.executeWebhook(action.config, triggerData);
      case 'INTEGRATION_CALL':
        return this.executeIntegrationCall(action.config, triggerData);
      default:
        throw new Error(`Unsupported workflow action type: ${action.actionType}`);
    }
  }

  private async executeNotification(config: any, triggerData: any) {
    logger.info('Executing workflow notification', { config, triggerData });
    return { success: true, type: 'NOTIFICATION' };
  }

  private async executeTask(config: any, triggerData: any) {
    logger.info('Executing workflow task', { config, triggerData });
    return { success: true, type: 'TASK' };
  }

  private async executeRecordUpdate(config: any, triggerData: any) {
    logger.info('Executing workflow record update', { config, triggerData });
    return { success: true, type: 'RECORD_UPDATE' };
  }

  private async executeWebhook(config: any, triggerData: any) {
    logger.info('Executing workflow webhook', { config, triggerData });
    return { success: true, type: 'WEBHOOK' };
  }

  private async executeIntegrationCall(config: any, triggerData: any) {
    logger.info('Executing workflow integration call', { config, triggerData });
    return { success: true, type: 'INTEGRATION_CALL' };
  }

  private async registerEventListeners() {
    eventBus.on('workflow:created', (data) => {
      logger.info('Workflow created event', data);
    });

    eventBus.on('workflow:execution:completed', (data) => {
      logger.info('Workflow execution completed', data);
    });

    eventBus.on('workflow:execution:failed', (data) => {
      logger.error('Workflow execution failed', data);
    });
  }
}

export const workflowEngine = new WorkflowEngine();
