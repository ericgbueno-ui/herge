import { WorkflowRepository } from '@/repositories/workflow/workflow.repository';

export class HistoryService {
  private repository = new WorkflowRepository();

  async getHistory(companyId: string, executionId?: string, workflowId?: string, limit?: number) {
    if (executionId) {
      return this.repository.listExecutionLogs(executionId, companyId);
    }

    if (workflowId) {
      const executions = await this.repository.listExecutions(companyId, workflowId);
      const executionIds = executions.map((execution) => execution.id);
      const history = await Promise.all(
        executionIds.map((id) => this.repository.listExecutionLogs(id, companyId))
      );
      return history.flat().slice(0, limit || history.flat().length);
    }

    return [];
  }

  async listExecutions(companyId: string, workflowId?: string, status?: string) {
    return this.repository.listExecutions(companyId, workflowId, status);
  }
}
