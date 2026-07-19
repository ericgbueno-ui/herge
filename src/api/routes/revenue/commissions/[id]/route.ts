import { NextRequest, NextResponse } from 'next/server';
import { CommissionService } from '@/services/revenue/commission.service';
import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';

const commissionService = new CommissionService(new EventBus(), new Logger());

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    const commission = await commissionService.getCommission(params.id, companyId);
    if (!commission) throw new ApiError(404, 'Commission not found');

    return NextResponse.json(commission);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    const body = await req.json();

    validateCompanyId(companyId);

    const updated = await commissionService.updateCommission(params.id, companyId, body);
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    await commissionService.deleteCommission(params.id, companyId);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
