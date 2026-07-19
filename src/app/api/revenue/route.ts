import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    service: 'revenue',
    message: 'Revenue API is available under /api/revenue/*',
  });
}
