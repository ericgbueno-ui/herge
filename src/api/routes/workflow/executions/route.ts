import { NextRequest, NextResponse } from 'next/server';
import { ExecutionService } from '@/services/workflow/execution.service';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const executionService = new ExecutionService(new Logger());

export async function GET(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const workflowId = req.nextUrl.searchParams.get('workflowId');
    const status = req.nextUrl.searchParams.get('status');
    const limit = req.nextUrl.searchParams.get('limit');

    const executions = await executionService.listExecutions(
      companyId,
      workflowId,
      status || undefined,
      limit ? Number(limit) : undefined
    );
    return NextResponse.json(executions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const body = await req.json();

    if (!body.workflowId) {
      throw new ApiError(400, 'Missing required field: workflowId');
    }

    const execution = await executionService.createExecution({
      companyId,
      workflowId: body.workflowId,
      triggerType: body.triggerType || 'MANUAL',
      triggeredBy: body.triggeredBy,
      triggerData: body.payload || body.triggerData,
    });

    await executionService.enqueueExecution(
      execution.id,
      body.workflowId,
      companyId,
      body.payload || body.triggerData
    );

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
