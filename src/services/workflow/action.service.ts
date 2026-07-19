import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';
import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { CreateWorkflowActionDTO } from '@/types/workflow/workflow.types';

export class ActionService {
  private repository = new WorkflowRepository();

  constructor(private eventBus: EventBus, private logger: Logger) {}

  async createAction(companyId: string, dto: CreateWorkflowActionDTO) {
    const workflow = await this.repository.findWorkflowById(dto.workflowId, companyId);
    if (!workflow) {
      throw new Error('Workflow not found or access denied');
    }

    const action = await this.repository.createAction({
      workflowId: dto.workflowId,
      actionType: dto.actionType,
      config: dto.config,
      order: dto.order || 0,
    });

    this.eventBus.emit('workflow:action:created', { companyId, workflowId: dto.workflowId, actionId: action.id });
    return action;
  }

  async updateAction(actionId: string, workflowId: string, companyId: string, updates: Partial<{ config: Record<string, any>; order: number; isActive: boolean }>) {
    const action = await this.repository.updateAction(actionId, workflowId, companyId, {
      config: updates.config,
      order: updates.order,
      isActive: updates.isActive,
    });

    if (!action) {
      throw new Error('Action not found or access denied');
    }

    this.eventBus.emit('workflow:action:updated', { companyId, workflowId, actionId });
    return action;
  }

  async listActions(workflowId: string, companyId: string) {
    return this.repository.listActions(workflowId, companyId);
  }
}
