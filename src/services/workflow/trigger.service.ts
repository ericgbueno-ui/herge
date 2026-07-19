import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';
import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { CreateWorkflowTriggerDTO } from '@/types/workflow/workflow.types';

export class TriggerService {
  private repository = new WorkflowRepository();

  constructor(private eventBus: EventBus, private logger: Logger) {}

  async createTrigger(companyId: string, dto: CreateWorkflowTriggerDTO) {
    const workflow = await this.repository.findWorkflowById(dto.workflowId, companyId);
    if (!workflow) {
      throw new Error('Workflow not found or access denied');
    }

    const trigger = await this.repository.createTrigger({
      workflowId: dto.workflowId,
      triggerType: dto.triggerType,
      config: dto.config,
    });

    this.eventBus.emit('workflow:trigger:created', { companyId, workflowId: dto.workflowId, triggerId: trigger.id });
    return trigger;
  }

  async updateTrigger(triggerId: string, workflowId: string, companyId: string, updates: Partial<{ config: Record<string, any>; isActive: boolean }>) {
    const trigger = await this.repository.updateTrigger(triggerId, workflowId, companyId, {
      config: updates.config,
      isActive: updates.isActive,
      lastTriggeredAt: updates.isActive === false ? null : undefined,
    });

    if (!trigger) {
      throw new Error('Trigger not found or access denied');
    }

    this.eventBus.emit('workflow:trigger:updated', { companyId, workflowId, triggerId });
    return trigger;
  }

  async listTriggers(workflowId: string, companyId: string) {
    return this.repository.listTriggers(workflowId, companyId);
  }
}
