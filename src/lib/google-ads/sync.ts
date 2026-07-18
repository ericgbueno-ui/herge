import { prisma } from "@/lib/prisma";

const GOOGLE_ADS_API = "https://googleads.googleapis.com/v17";

interface SyncableGoogleAccount {
  id: string;
  externalAccountId: string;
  refreshToken: string;
  companyId: string | null;
  loginCustomerId?: string | null;
}

interface DailyRow {
  campaignId: string;
  campaignName: string;
  date: string;
  costMicros: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

async function getGoogleAdsAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.access_token || null;
  } catch (err) {
    console.error("Failed to get Google Ads access token:", err);
    return null;
  }
}

/**
 * Busca métricas diárias por campanha em uma única query GAQL.
 */
async function fetchDailyCampaignMetrics(
  account: SyncableGoogleAccount,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<DailyRow[]> {
  const customerId = account.externalAccountId.replace(/-/g, "");
  const query = `
    SELECT campaign.id, campaign.name, segments.date,
           metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
    ORDER BY segments.date
  `;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
  };
  if (account.loginCustomerId) {
    headers["login-customer-id"] = account.loginCustomerId.replace(/-/g, "");
  }

  const rows: DailyRow[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetch(
      `${GOOGLE_ADS_API}/customers/${customerId}/googleAds:search`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query, pageToken }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const message =
        data.error?.message || data[0]?.error?.message || `Google Ads API error: ${response.status}`;
      throw new Error(message);
    }

    for (const r of data.results || []) {
      rows.push({
        campaignId: String(r.campaign.id),
        campaignName: r.campaign.name,
        date: r.segments.date,
        costMicros: parseInt(r.metrics.costMicros || r.metrics.cost_micros || "0"),
        impressions: parseInt(r.metrics.impressions || "0"),
        clicks: parseInt(r.metrics.clicks || "0"),
        conversions: Math.round(parseFloat(r.metrics.conversions || "0")),
        conversionValue: parseFloat(r.metrics.conversionsValue || r.metrics.conversions_value || "0"),
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return rows;
}

/**
 * Sincroniza campanhas e métricas diárias de uma conta Google Ads.
 */
export async function syncGoogleAdsAccount(
  account: SyncableGoogleAccount,
  days = 30
): Promise<{ campaigns: number; snapshots: number }> {
  const accessToken = await getGoogleAdsAccessToken(account.refreshToken);
  if (!accessToken) {
    throw new Error("Não foi possível obter access token do Google Ads");
  }

  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const dateStart = start.toISOString().slice(0, 10);
  const dateEnd = end.toISOString().slice(0, 10);

  const rows = await fetchDailyCampaignMetrics(account, accessToken, dateStart, dateEnd);

  const campaignIds = new Map<string, string>();
  let snapshots = 0;

  for (const row of rows) {
    let campaignId = campaignIds.get(row.campaignId);
    if (!campaignId) {
      const campaign = await prisma.campaign.upsert({
        where: {
          adAccountId_externalCampaignId: {
            adAccountId: account.id,
            externalCampaignId: row.campaignId,
          },
        },
        update: { name: row.campaignName, companyId: account.companyId ?? undefined },
        create: {
          adAccountId: account.id,
          externalCampaignId: row.campaignId,
          name: row.campaignName,
          companyId: account.companyId,
        },
      });
      campaignId = campaign.id;
      campaignIds.set(row.campaignId, campaignId);
    }

    await prisma.metricSnapshot.upsert({
      where: { campaignId_date: { campaignId, date: new Date(row.date) } },
      update: {
        spend: row.costMicros / 1_000_000,
        impressions: row.impressions,
        clicks: row.clicks,
        conversions: row.conversions,
        conversionValue: row.conversionValue,
      },
      create: {
        campaignId,
        date: new Date(row.date),
        spend: row.costMicros / 1_000_000,
        impressions: row.impressions,
        clicks: row.clicks,
        conversions: row.conversions,
        conversionValue: row.conversionValue,
      },
    });
    snapshots++;
  }

  await prisma.adAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return { campaigns: campaignIds.size, snapshots };
}
