import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v21.0";
const META_GRAPH_API = "https://graph.facebook.com";

interface MetaAction {
  action_type: string;
  value: string;
}

interface DailyCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
}

interface SyncableAdAccount {
  id: string;
  externalAccountId: string;
  accessToken: string;
  companyId: string | null;
}

// Prioridade dos tipos de ação de compra (evita dupla contagem)
const PURCHASE_TYPES = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];

function pickPurchase(actions?: MetaAction[]): number {
  if (!actions) return 0;
  for (const type of PURCHASE_TYPES) {
    const found = actions.find((a) => a.action_type === type);
    if (found) return parseFloat(found.value) || 0;
  }
  return 0;
}

/**
 * Busca insights diários (nível campanha) dos últimos N dias em uma única
 * chamada paginada e grava Campaign + MetricSnapshot no banco.
 */
export async function syncMetaAdAccount(
  account: SyncableAdAccount,
  days = 30
): Promise<{ campaigns: number; snapshots: number }> {
  const actId = account.externalAccountId.startsWith("act_")
    ? account.externalAccountId
    : `act_${account.externalAccountId}`;

  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const since = start.toISOString().slice(0, 10);
  const until = end.toISOString().slice(0, 10);

  const rows: DailyCampaignInsight[] = [];
  let url: string | null =
    `${META_GRAPH_API}/${META_API_VERSION}/${actId}/insights?` +
    `level=campaign` +
    `&fields=campaign_id,campaign_name,spend,impressions,clicks,actions,action_values` +
    `&time_increment=1` +
    `&time_range={"since":"${since}","until":"${until}"}` +
    `&limit=500` +
    `&access_token=${account.accessToken}`;

  while (url) {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Meta API error: ${response.status}`);
    }
    rows.push(...(data.data || []));
    url = data.paging?.next || null;
  }

  const campaignIds = new Map<string, string>();
  let snapshots = 0;

  for (const row of rows) {
    let campaignId = campaignIds.get(row.campaign_id);
    if (!campaignId) {
      const campaign = await prisma.campaign.upsert({
        where: {
          adAccountId_externalCampaignId: {
            adAccountId: account.id,
            externalCampaignId: row.campaign_id,
          },
        },
        update: { name: row.campaign_name, companyId: account.companyId ?? undefined },
        create: {
          adAccountId: account.id,
          externalCampaignId: row.campaign_id,
          name: row.campaign_name,
          companyId: account.companyId,
        },
      });
      campaignId = campaign.id;
      campaignIds.set(row.campaign_id, campaignId);
    }

    const date = new Date(row.date_start);
    const spend = parseFloat(row.spend || "0");
    const impressions = parseInt(row.impressions || "0");
    const clicks = parseInt(row.clicks || "0");
    const conversions = Math.round(pickPurchase(row.actions));
    const conversionValue = pickPurchase(row.action_values);

    await prisma.metricSnapshot.upsert({
      where: { campaignId_date: { campaignId, date } },
      update: { spend, impressions, clicks, conversions, conversionValue },
      create: { campaignId, date, spend, impressions, clicks, conversions, conversionValue },
    });
    snapshots++;
  }

  await prisma.adAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return { campaigns: campaignIds.size, snapshots };
}
