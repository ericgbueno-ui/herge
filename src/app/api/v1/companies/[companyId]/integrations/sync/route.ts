import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-middleware";

/**
 * POST /api/v1/companies/:companyId/integrations/sync
 * Sincronizar dados de integrações
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
    const { integrationId, type } = await request.json();

    const integration = await prisma.companyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    let syncResult = {
      success: true,
      data: {},
      lastSyncAt: new Date(),
    };

    switch (integration.type) {
      case "meta_ads":
        syncResult.data = await syncMetaAds(integration);
        break;
      case "google_ads":
        syncResult.data = await syncGoogleAds(integration);
        break;
      case "tiktok_ads":
        syncResult.data = await syncTikTokAds(integration);
        break;
      case "shopee_ads":
        syncResult.data = await syncShopeeAds(integration);
        break;
    }

    // Atualizar lastSyncAt
    await prisma.companyIntegration.update({
      where: { id: integrationId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json(syncResult);
  } catch (error) {
    console.error("Sync integration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function syncMetaAds(integration: any) {
  // Mock data - em produção, chamar Meta Ads API
  return {
    accountsCount: 3,
    campaignsCount: 12,
    adsCount: 45,
    impressions: 1250000,
    clicks: 15400,
    spend: 8450.50,
    results: 342,
  };
}

async function syncGoogleAds(integration: any) {
  // Mock data - em produção, chamar Google Ads API
  return {
    accountsCount: 2,
    campaignsCount: 8,
    adsCount: 24,
    impressions: 890000,
    clicks: 12300,
    spend: 6200.75,
    results: 287,
  };
}

async function syncTikTokAds(integration: any) {
  // Mock data - em produção, chamar TikTok Ads API
  return {
    accountsCount: 1,
    campaignsCount: 5,
    adsCount: 18,
    impressions: 650000,
    clicks: 8900,
    spend: 3800.25,
    results: 156,
  };
}

async function syncShopeeAds(integration: any) {
  // Mock data - em produção, chamar Shopee Ads API
  return {
    accountsCount: 1,
    campaignsCount: 4,
    adsCount: 12,
    impressions: 420000,
    clicks: 5600,
    spend: 2100.00,
    results: 78,
  };
}
