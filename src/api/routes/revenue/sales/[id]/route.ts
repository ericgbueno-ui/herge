import { NextRequest, NextResponse } from 'next/server';
import { SaleService } from '@/services/revenue/sale.service';
import { EventBus } from '@/core/events/event-bus';
import { Logger } from '@/lib/logger';
import { handleApiError, ApiError, validateCompanyId } from '@/api/middleware/error-handler';
import { Decimal } from '@prisma/client/runtime/library';

const saleService = new SaleService(new EventBus(), new Logger());

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    const sale = await saleService.getSale(params.id, companyId);
    if (!sale) throw new ApiError(404, 'Sale not found');

    return NextResponse.json(sale);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    const body = await req.json();

    validateCompanyId(companyId);

    const sale = await saleService.updateSale(params.id, companyId, {
      totalAmount: body.totalAmount ? new Decimal(body.totalAmount) : undefined,
      status: body.status,
      products: body.products,
    });

    if (!sale) throw new ApiError(404, 'Sale not found');
    return NextResponse.json(sale);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const companyId = req.nextUrl.searchParams.get('companyId');
    validateCompanyId(companyId);

    await saleService.deleteSale(params.id, companyId);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
