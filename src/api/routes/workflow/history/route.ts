import { NextRequest, NextResponse } from 'next/server';
import { HistoryService } from '@/services/workflow/history.service';
import { handleApiError, validateCompanyId } from '@/api/middleware/error-handler';

const historyService = new HistoryService();

export async function GET(req: NextRequest, context?: { params: Record<string, string> }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);
    const executionId = req.nextUrl.searchParams.get('executionId') || context?.params?.id;
    const workflowId = req.nextUrl.searchParams.get('workflowId') || context?.params?.id;
    const limit = req.nextUrl.searchParams.get('limit');

    if (!executionId && !workflowId) {
      throw new Error('executionId or workflowId is required');
    }

    const history = await historyService.getHistory(companyId, executionId || undefined, workflowId || undefined, limit ? Number(limit) : undefined);
    return NextResponse.json(history);
  } catch (error) {
    return handleApiError(error);
  }
}
