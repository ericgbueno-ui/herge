import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fetchMetaCampaignInsights } from "@/lib/ads/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/sync/all-channels
 * Sincroniza dados reais de todos os canais (Meta, Google, TikTok, Shopee)
 * Requer autenticação e permissão de admin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId, days = 30 } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    // Verificar se usuário tem acesso à empresa
    const companyUser = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: session.user.id, companyId } },
    });

    if (!companyUser?.isOwner) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const results = {
      meta: { synced: 0, error: null as string | null },
      google: { synced: 0, error: null as string | null },
      tiktok: { synced: 0, error: null as string | null },
      shopee: { synced: 0, error: null as string | null },
    };

    // ============= SINCRONIZAR META ADS =============
    try {
      const metaAccount = await prisma.adAccount.findFirst({
        where: { companyId, channel: "META" },
      });

      if (metaAccount?.accessToken) {
        const today = new Date();
        const since = new Date(today);
        since.setDate(since.getDate() - days);

        const metaMetrics = await fetchMetaCampaignInsights({
          accountExternalId: metaAccount.externalAccountId,
          since: since.toISOString().split("T")[0],
          until: today.toISOString().split("T")[0],
          accessToken: metaAccount.accessToken,
        });

        let synced = 0;
        for (const metric of metaMetrics) {
          // Criar ou atualizar campanha
          const campaign = await prisma.campaign.upsert({
            where: {
              adAccountId_externalCampaignId: {
                adAccountId: metaAccount.id,
                externalCampaignId: metric.externalCampaignId,
              },
            },
            update: { name: metric.campaignName, objective: metric.objective },
            create: {
              adAccountId: metaAccount.id,
              externalCampaignId: metric.externalCampaignId,
              name: metric.campaignName,
              objective: metric.objective,
              companyId,
            },
          });

          // Criar ou atualizar métrica diária
          const dateObj = new Date(metric.date + "T00:00:00Z");
          await prisma.metricSnapshot.upsert({
            where: { campaignId_date: { campaignId: campaign.id, date: dateObj } },
            update: {
              spend: metric.spend,
              impressions: metric.impressions,
              clicks: metric.clicks,
              conversions: metric.conversions,
              conversionValue: metric.conversionValue,
              raw: metric.raw,
            },
            create: {
              campaignId: campaign.id,
              date: dateObj,
              spend: metric.spend,
              impressions: metric.impressions,
              clicks: metric.clicks,
              conversions: metric.conversions,
              conversionValue: metric.conversionValue,
              raw: metric.raw,
            },
          });

          synced++;
        }

        // Atualizar último sync
        await prisma.adAccount.update({
          where: { id: metaAccount.id },
          data: { lastSyncedAt: new Date() },
        });

        results.meta.synced = synced;
      }
    } catch (err: any) {
      results.meta.error = err.message;
    }

    // ============= SINCRONIZAR GOOGLE ADS =============
    try {
      const googleAccount = await prisma.adAccount.findFirst({
        where: { companyId, channel: "GOOGLE" },
      });

      if (googleAccount) {
        // TODO: Implementar sincronização com Google Ads API
        // Por enquanto, gerar dados de demonstração
        results.google.synced = 0;
        results.google.error = "Google Ads API não configurada - requer credenciais OAuth";
      }
    } catch (err: any) {
      results.google.error = err.message;
    }

    // ============= SINCRONIZAR TIKTOK ADS =============
    try {
      const tiktokAccount = await prisma.adAccount.findFirst({
        where: { companyId, channel: "TIKTOK" },
      });

      if (tiktokAccount) {
        // TODO: Implementar sincronização com TikTok Ads API
        results.tiktok.synced = 0;
        results.tiktok.error = "TikTok Ads API não configurada - requer credenciais de desenvolvedor";
      }
    } catch (err: any) {
      results.tiktok.error = err.message;
    }

    // ============= SINCRONIZAR SHOPEE ADS =============
    try {
      const shopeeAccount = await prisma.adAccount.findFirst({
        where: { companyId, channel: "SHOPEE" },
      });

      if (shopeeAccount) {
        // TODO: Implementar sincronização com Shopee API
        results.shopee.synced = 0;
        results.shopee.error = "Shopee API não configurada - requer credenciais de shop";
      }
    } catch (err: any) {
      results.shopee.error = err.message;
    }

    const totalSynced = Object.values(results).reduce((acc, r) => acc + r.synced, 0);

    return NextResponse.json({
      ok: true,
      message: `Sincronização concluída: ${totalSynced} registros atualizados`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
