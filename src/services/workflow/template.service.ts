import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';
import { EventBus } from '@/core/events/event-bus';

export class TemplateService {
  private repository = new WorkflowRepository();

  constructor(private eventBus: EventBus) {}

  async createTemplate(companyId: string, dto: { name: string; description?: string; triggerType: string; category?: string; templateData: Record<string, any>; }) {
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

  async getTemplate(templateId: string, companyId: string) {
    const template = await this.repository.findTemplateById(templateId, companyId);
    if (!template) {
      throw new Error('Template not found or access denied');
    }
    return template;
  }

  async updateTemplate(templateId: string, companyId: string, updates: Partial<{ name: string; description: string; triggerType: string; category: string; templateData: Record<string, any>; isActive: boolean; version: number; }>) {
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

  async deleteTemplate(templateId: string, companyId: string) {
    const template = await this.repository.findTemplateById(templateId, companyId);
    if (!template) {
      throw new Error('Template not found or access denied');
    }

    await this.repository.updateTemplate(templateId, companyId, { isActive: false });
    this.eventBus.emit('workflow:template:deleted', { companyId, templateId });
    return true;
  }

  async listTemplates(companyId: string, isActive?: boolean) {
    return this.repository.listTemplates(companyId, isActive);
  }
}
