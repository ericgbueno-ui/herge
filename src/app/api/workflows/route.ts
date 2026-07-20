import { NextResponse } from "next/server";

function removed() {
  return NextResponse.json(
    { error: "API de workflows legada removida; nenhuma automação ativa depende desta rota." },
    { status: 410 }
  );
}

export const GET = removed;
export const POST = removed;
export const PATCH = removed;
export const DELETE = removed;
