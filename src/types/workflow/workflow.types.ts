export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type WorkflowTriggerType = 'MANUAL' | 'SCHEDULED' | 'EVENT' | 'WEBHOOK';
export type WorkflowActionType = 'NOTIFICATION' | 'TASK' | 'RECORD_UPDATE' | 'WEBHOOK' | 'INTEGRATION_CALL';
export type WorkflowExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELED';

export interface WorkflowDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  config?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTriggerDTO {
  id: string;
  workflowId: string;
  triggerType: WorkflowTriggerType;
  config: Record<string, any>;
  isActive: boolean;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowActionDTO {
  id: string;
  workflowId: string;
  actionType: WorkflowActionType;
  config: Record<string, any>;
  actionOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionDTO {
  id: string;
  workflowId: string;
  companyId: string;
  status: WorkflowExecutionStatus;
  triggerType: WorkflowTriggerType;
  triggeredBy?: string | null;
  triggerData?: Record<string, any> | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  result?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionLogDTO {
  id: string;
  executionId: string;
  companyId: string;
  eventType: string;
  message?: string | null;
  payload?: Record<string, any> | null;
  createdAt: string;
}

export interface WorkflowTemplateDTO {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  version: number;
  triggerType: WorkflowTriggerType;
  category?: string | null;
  templateData: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowDTO {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateWorkflowTriggerDTO {
  workflowId: string;
  triggerType: WorkflowTriggerType;
  config: Record<string, any>;
}

export interface CreateWorkflowActionDTO {
  workflowId: string;
  actionType: WorkflowActionType;
  config: Record<string, any>;
  actionOrder?: number;
}

export interface CreateWorkflowExecutionDTO {
  workflowId: string;
  triggerType: WorkflowTriggerType;
  triggeredBy?: string;
  triggerData?: Record<string, any>;
}

export interface CreateWorkflowTemplateDTO {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  category?: string;
  templateData: Record<string, any>;
}
