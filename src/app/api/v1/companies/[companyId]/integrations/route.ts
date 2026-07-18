import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";
import { z } from "zod";

const createIntegrationSchema = z.object({
  type: z.enum(["meta_ads", "google_ads", "tiktok_ads", "shopee_ads"]),
  name: z.string().min(1),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  config: z.record(z.any()).optional(),
});

/**
 * GET /api/v1/companies/:companyId/integrations
 * Listar integrações da empresa
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const integrations = await prisma.companyIntegration.findMany({
      where: { companyId: params.companyId },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        connectedAt: true,
        lastSyncAt: true,
        lastError: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error("Get integrations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/companies/:companyId/integrations
 * Criar integração
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const authResult = await requireAuth(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createIntegrationSchema.parse(body);

    // Verificar que company existe
    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Verificar se integração já existe
    const existing = await prisma.companyIntegration.findUnique({
      where: {
        companyId_type: {
          companyId: params.companyId,
          type: data.type,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Integration already exists" },
        { status: 400 }
      );
    }

    // Criar integração
    const integration = await prisma.companyIntegration.create({
      data: {
        companyId: params.companyId,
        type: data.type,
        name: data.name,
        status: "connected",
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        config: data.config,
        connectedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: integration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create integration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
