import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/workflow/workflow.service';
import { getEventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const workflowService = new WorkflowService(getEventBus(), new Logger());

export async function GET(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    if (context?.params?.id) {
      const workflow = await workflowService.getWorkflow(context.params.id, companyId);
      if (!workflow) {
        throw new ApiError(404, 'Workflow not found');
      }
      return NextResponse.json(workflow);
    }

    const status = req.nextUrl.searchParams.get('status');
    const workflows = await workflowService.listWorkflows(companyId, status || undefined);
    return NextResponse.json(workflows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();

    if (!body.name || !body.triggerType) {
      throw new ApiError(400, 'Missing required fields: name, triggerType');
    }

    const workflow = await workflowService.createWorkflow(companyId, {
      name: body.name,
      description: body.description,
      triggerType: body.triggerType,
      config: body.config,
      metadata: body.metadata,
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();
    const workflowId = context?.params?.id;

    if (!workflowId) {
      throw new ApiError(400, 'Workflow id is required');
    }

    const workflow = await workflowService.updateWorkflow(workflowId, companyId, {
      name: body.name,
      description: body.description,
      triggerType: body.triggerType,
      config: body.config,
      metadata: body.metadata,
      status: body.status,
      version: body.version,
    });

    return NextResponse.json(workflow);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const workflowId = context?.params?.id;

    if (!workflowId) {
      throw new ApiError(400, 'Workflow id is required');
    }

    await workflowService.deleteWorkflow(workflowId, companyId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
