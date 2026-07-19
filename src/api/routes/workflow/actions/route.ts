import { NextRequest, NextResponse } from 'next/server';
import { ActionService } from '@/services/workflow/action.service';
import { getEventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const actionService = new ActionService(getEventBus(), new Logger());

export async function GET(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const workflowId = context?.params?.id;

    if (!workflowId) {
      throw new ApiError(400, 'Workflow id is required to list actions');
    }

    const actions = await actionService.listActions(workflowId, companyId);
    return NextResponse.json(actions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();

    if (!body.workflowId || !body.actionType || !body.config) {
      throw new ApiError(400, 'Missing required fields: workflowId, actionType, config');
    }

    const action = await actionService.createAction(companyId, {
      workflowId: body.workflowId,
      actionType: body.actionType,
      config: body.config,
      order: body.order,
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();
    const actionId = context?.params?.id;

    if (!actionId) {
      throw new ApiError(400, 'Action id is required');
    }

    const workflowId = body.workflowId;
    if (!workflowId) {
      throw new ApiError(400, 'workflowId is required to update action');
    }

    const action = await actionService.updateAction(actionId, workflowId, companyId, {
      config: body.config,
      order: body.order,
      isActive: body.isActive,
    });

    return NextResponse.json(action);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const actionId = context?.params?.id;
    const body = await req.json();
    const workflowId = body.workflowId;

    if (!actionId || !workflowId) {
      throw new ApiError(400, 'Action id and workflowId are required');
    }

    const action = await actionService.updateAction(actionId, workflowId, companyId, { isActive: false });

    return NextResponse.json(action);
  } catch (error) {
    return handleApiError(error);
  }
}
