import { NextRequest, NextResponse } from 'next/server';
import { TriggerService } from '@/services/workflow/trigger.service';
import { getEventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const triggerService = new TriggerService(getEventBus(), new Logger());

export async function GET(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const workflowId = context?.params?.id;

    if (!workflowId) {
      throw new ApiError(400, 'Workflow id is required to list triggers');
    }

    const triggers = await triggerService.listTriggers(workflowId, companyId);
    return NextResponse.json(triggers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();

    if (!body.workflowId || !body.triggerType || !body.config) {
      throw new ApiError(400, 'Missing required fields: workflowId, triggerType, config');
    }

    const trigger = await triggerService.createTrigger(companyId, {
      workflowId: body.workflowId,
      triggerType: body.triggerType,
      config: body.config,
    });

    return NextResponse.json(trigger, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();
    const triggerId = context?.params?.id;

    if (!triggerId) {
      throw new ApiError(400, 'Trigger id is required');
    }

    const workflowId = body.workflowId;
    if (!workflowId) {
      throw new ApiError(400, 'workflowId is required to update trigger');
    }

    const trigger = await triggerService.updateTrigger(triggerId, workflowId, companyId, {
      config: body.config,
      isActive: body.isActive,
    });

    return NextResponse.json(trigger);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const triggerId = context?.params?.id;
    const body = await req.json();
    const workflowId = body.workflowId;

    if (!triggerId || !workflowId) {
      throw new ApiError(400, 'Trigger id and workflowId are required');
    }

    const trigger = await triggerService.updateTrigger(triggerId, workflowId, companyId, { isActive: false });

    return NextResponse.json(trigger);
  } catch (error) {
    return handleApiError(error);
  }
}
