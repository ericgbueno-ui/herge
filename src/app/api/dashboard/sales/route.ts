import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SaleInput = z.object({
  companyId: z.string().min(1),
  campaignId: z.string().min(1).nullable(),
  amount: z.coerce.number().positive("Informe um valor de venda maior que zero"),
  profit: z.coerce.number().min(0, "O lucro não pode ser negativo"),
  productName: z.string().trim().max(160).optional(),
  saleDate: z.string().date(),
  notes: z.string().trim().max(500).optional(),
});

async function hasCompanyAccess(userId: string, companyId: string) {
  return prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { id: true },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "Selecione um cliente" }, { status: 400 });
  if (!(await hasCompanyAccess(session.user.id, companyId))) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const sales = await prisma.sale.findMany({
    where: { companyId, dataOrigin: { not: "DEMO" } },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      amount: true,
      profit: true,
      productName: true,
      completedAt: true,
      createdAt: true,
      notes: true,
      dataOrigin: true,
      campaign: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    sales: sales.map((sale) => ({ ...sale, amount: Number(sale.amount), profit: sale.profit === null ? null : Number(sale.profit) })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = SaleInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
  const input = parsed.data;
  if (!(await hasCompanyAccess(session.user.id, input.companyId))) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  if (input.campaignId) {
    const campaign = await prisma.campaign.findFirst({ where: { id: input.campaignId, companyId: input.companyId }, select: { id: true } });
    if (!campaign) return NextResponse.json({ error: "A campanha não pertence ao cliente selecionado" }, { status: 400 });
  }

  const occurredAt = new Date(`${input.saleDate}T12:00:00.000Z`);
  const sale = await prisma.sale.create({
    data: {
      companyId: input.companyId,
      campaignId: input.campaignId,
      amount: input.amount,
      profit: input.profit,
      productName: input.productName || null,
      notes: input.notes || null,
      source: "client_report",
      paymentStatus: "completed",
      dataOrigin: "MANUAL",
      sourceSystem: "HERGEL_MANUAL",
      actorUserId: session.user.id,
      completedAt: occurredAt,
      createdAt: occurredAt,
    },
    select: { id: true },
  });

  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: session.user.id,
      action: "create",
      resource: "Sale",
      resourceId: sale.id,
      description: `Venda manual registrada: ${input.amount}`,
    },
  });

  return NextResponse.json({ ok: true, saleId: sale.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const saleId = req.nextUrl.searchParams.get("saleId");
  if (!saleId) return NextResponse.json({ error: "Venda não informada" }, { status: 400 });

  const sale = await prisma.sale.findFirst({ where: { id: saleId, dataOrigin: "MANUAL" }, select: { id: true, companyId: true, amount: true } });
  if (!sale) return NextResponse.json({ error: "Venda manual não encontrada" }, { status: 404 });
  if (!(await hasCompanyAccess(session.user.id, sale.companyId))) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  await prisma.$transaction([
    prisma.sale.delete({ where: { id: sale.id } }),
    prisma.auditLog.create({ data: { companyId: sale.companyId, userId: session.user.id, action: "delete", resource: "Sale", resourceId: sale.id, description: `Venda manual removida: ${sale.amount}` } }),
  ]);
  return NextResponse.json({ ok: true });
}
