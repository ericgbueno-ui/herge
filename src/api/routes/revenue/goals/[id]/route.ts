import { NextRequest, NextResponse } from 'next/server';
import { GoalService } from '@/services/revenue/goal.service';
import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const goalService = new GoalService(new EventBus(), new Logger());

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    const goal = await goalService.getGoal(params.id, companyId);
    if (!goal) throw new ApiError(404, 'Goal not found');

    return NextResponse.json(goal);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    const body = await req.json();

    validateCompanyId(companyId);

    if (body.action === 'complete') {
      const completed = await goalService.completeGoal(params.id, companyId);
      return NextResponse.json(completed);
    }

    if (body.action === 'fail') {
      const failed = await goalService.failGoal(params.id, companyId, body.reason);
      return NextResponse.json(failed);
    }

    if (body.currentValue !== undefined) {
      const updated = await goalService.updateProgress(params.id, body.currentValue);
      return NextResponse.json(updated);
    }

    throw new ApiError(400, 'Invalid action or missing currentValue');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    await goalService.deleteGoal(params.id, companyId);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
