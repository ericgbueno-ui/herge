import { NextRequest } from 'next/server';
import { dispatchRevenueRequest } from '../_router';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return dispatchRevenueRequest(req, 'GET', params.path || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return dispatchRevenueRequest(req, 'POST', params.path || []);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return dispatchRevenueRequest(req, 'PATCH', params.path || []);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return dispatchRevenueRequest(req, 'DELETE', params.path || []);
}
