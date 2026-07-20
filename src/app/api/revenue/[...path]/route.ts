import { NextResponse } from "next/server";

function removed() {
  return NextResponse.json(
    {
      error: "API legada removida",
      replacement: "/api/dashboard/control-center e /api/v1/companies/:companyId/sales",
    },
    { status: 410 }
  );
}

export const GET = removed;
export const POST = removed;
export const PATCH = removed;
export const DELETE = removed;
