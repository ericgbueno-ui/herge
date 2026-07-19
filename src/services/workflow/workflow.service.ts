import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';
import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { CreateWorkflowDTO, CreateWorkflowTriggerDTO, CreateWorkflowActionDTO, CreateWorkflowTemplateDTO } from '@/types/workflow/workflow.types';

export class WorkflowService {
  private repository = new WorkflowRepository();

  constructor(private eventBus: EventBus, private logger: Logger) {}

  async createWorkflow(companyId: string, dto: CreateWorkflowDTO) {
    const workflow = await this.repository.createWorkflow({
      companyId,
      name: dto.name,
      description: dto.description,
      status: 'DRAFT',
      triggerType: dto.triggerType,
      config: dto.config,
      metadata: dto.metadata,
      version: 1,
    });

    this.eventBus.emit('workflow:created', { companyId, workflowId: workflow.id });
    return workflow;
  }

  async updateWorkflow(workflowId: string, companyId: string, updates: Partial<CreateWorkflowDTO> & { status?: string; version?: number }) {
    const workflow = await this.repository.updateWorkflow(workflowId, companyId, {
      name: updates.name,
      description: updates.description,
      status: updates.status,
      triggerType: updates.triggerType,
      config: updates.config,
      metadata: updates.metadata,
      version: updates.version,
    });

    if (!workflow) {
      throw new Error('Workflow not found or access denied');
    }

    this.eventBus.emit('workflow:updated', { companyId, workflowId: workflow.id });
    return workflow;
  }

  async listWorkflows(companyId: string, status?: string) {
    return this.repository.listWorkflows(companyId, status);
  }

  async getWorkflow(workflowId: string, companyId: string) {
    return this.repository.findWorkflowById(workflowId, companyId);
  }

  async deleteWorkflow(workflowId: string, companyId: string) {
    await this.repository.deleteWorkflow(workflowId, companyId);
    this.eventBus.emit('workflow:deleted', { companyId, workflowId });
    return true;
  }

  async createTrigger(companyId: string, dto: CreateWorkflowTriggerDTO) {
    const workflow = await this.getWorkflow(dto.workflowId, companyId);
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

  async createAction(companyId: string, dto: CreateWorkflowActionDTO) {
    const workflow = await this.getWorkflow(dto.workflowId, companyId);
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

  async createTemplate(companyId: string, dto: CreateWorkflowTemplateDTO) {
    const template = await this.repository.createTemplate({
      companyId,
      name: dto.name,
      description: dto.description,
      triggerType: dto.triggerType,
      category: dto.category,
      templateData: dto.templateData,
      version: 1,
      isActive: true,
    });

    this.eventBus.emit('workflow:template:created', { companyId, templateId: template.id });
    return template;
  }

  async updateTemplate(templateId: string, companyId: string, updates: Partial<CreateWorkflowTemplateDTO & { isActive: boolean }>) {
    const template = await this.repository.updateTemplate(templateId, companyId, {
      name: updates.name,
      description: updates.description,
      version: updates.version,
      triggerType: updates.triggerType,
      category: updates.category,
      templateData: updates.templateData,
      isActive: updates.isActive,
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    this.eventBus.emit('workflow:template:updated', { companyId, templateId });
    return template;
  }

  async listTemplates(companyId: string, isActive?: boolean) {
    return this.repository.listTemplates(companyId, isActive);
  }

  async findActiveWorkflowsByEvent(eventName: string) {
    return this.repository.findActiveWorkflowsByEvent(eventName);
  }

  async getWorkflowActions(workflowId: string, companyId: string) {
    return this.listActions(workflowId, companyId);
  }
}
