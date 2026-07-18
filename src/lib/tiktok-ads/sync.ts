import { prisma } from "@/lib/prisma";

const TIKTOK_API_VERSION = "v1.3";
const TIKTOK_API_BASE = "https://business-api.tiktok.com/open_api";

interface SyncableTikTokAccount {
  id: string;
  externalAccountId: string; // advertiser_id
  accessToken: string;
  companyId: string | null;
}

interface TikTokDailyRow {
  dimensions: { campaign_id: string; stat_time_day: string };
  metrics: {
    campaign_name?: string;
    spend?: string;
    impressions?: string;
    clicks?: string;
    conversion?: string;
    total_complete_payment_value?: string;
  };
}

/**
 * Relatório integrado diário por campanha (uma chamada paginada por conta).
 */
async function fetchTikTokDailyReport(
  account: SyncableTikTokAccount,
  dateStart: string,
  dateEnd: string
): Promise<TikTokDailyRow[]> {
  const rows: TikTokDailyRow[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const params = new URLSearchParams({
      advertiser_id: account.externalAccountId,
      report_type: "BASIC",
      data_level: "AUCTION_CAMPAIGN",
      dimensions: JSON.stringify(["campaign_id", "stat_time_day"]),
      metrics: JSON.stringify([
        "campaign_name",
        "spend",
        "impressions",
        "clicks",
        "conversion",
        "total_complete_payment_value",
      ]),
      start_date: dateStart,
      end_date: dateEnd,
      page: String(page),
      page_size: "200",
    });

    const response = await fetch(
      `${TIKTOK_API_BASE}/${TIKTOK_API_VERSION}/report/integrated/get/?${params}`,
      { headers: { "Access-Token": account.accessToken } }
    );

    const data = await response.json();
    if (!response.ok || data.code !== 0) {
      throw new Error(data.message || `TikTok API error: ${response.status}`);
    }

    rows.push(...(data.data?.list || []));
    totalPages = data.data?.page_info?.total_page || 1;
    page++;
  }

  return rows;
}

/**
 * Sincroniza campanhas e métricas diárias de um advertiser TikTok.
 */
export async function syncTikTokAdAccount(
  account: SyncableTikTokAccount,
  days = 30
): Promise<{ campaigns: number; snapshots: number }> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const dateStart = start.toISOString().slice(0, 10);
  const dateEnd = end.toISOString().slice(0, 10);

  const rows = await fetchTikTokDailyReport(account, dateStart, dateEnd);

  const campaignIds = new Map<string, string>();
  let snapshots = 0;

  for (const row of rows) {
    const extId = row.dimensions.campaign_id;
    let campaignId = campaignIds.get(extId);
    if (!campaignId) {
      const campaign = await prisma.campaign.upsert({
        where: {
          adAccountId_externalCampaignId: {
            adAccountId: account.id,
            externalCampaignId: extId,
          },
        },
        update: {
          name: row.metrics.campaign_name || extId,
          companyId: account.companyId ?? undefined,
        },
        create: {
          adAccountId: account.id,
          externalCampaignId: extId,
          name: row.metrics.campaign_name || extId,
          companyId: account.companyId,
        },
      });
      campaignId = campaign.id;
      campaignIds.set(extId, campaignId);
    }

    // stat_time_day vem como "2026-07-18 00:00:00"
    const date = new Date(row.dimensions.stat_time_day.slice(0, 10));
    const payload = {
      spend: parseFloat(row.metrics.spend || "0"),
      impressions: parseInt(row.metrics.impressions || "0"),
      clicks: parseInt(row.metrics.clicks || "0"),
      conversions: parseInt(row.metrics.conversion || "0"),
      conversionValue: parseFloat(row.metrics.total_complete_payment_value || "0"),
    };

    await prisma.metricSnapshot.upsert({
      where: { campaignId_date: { campaignId, date } },
      update: payload,
      create: { campaignId, date, ...payload },
    });
    snapshots++;
  }

  await prisma.adAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return { campaigns: campaignIds.size, snapshots };
}
