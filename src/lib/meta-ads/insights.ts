const META_API_VERSION = "v21.0";
const META_GRAPH_API = "https://graph.facebook.com";

export interface MetaInsight {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
}

export interface CampaignMetrics {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  roas: number;
  conversionValue: number;
}

export async function fetchMetaInsights(
  accessToken: string,
  accountId: string,
  dateStart: string,
  dateEnd: string
): Promise<MetaInsight[]> {
  const url = `${META_GRAPH_API}/${META_API_VERSION}/${accountId}/insights?` +
    `fields=spend,impressions,clicks&` +
    `time_increment=1&` +
    `time_range={"since":"${dateStart}","until":"${dateEnd}"}&` +
    `access_token=${accessToken}`;

  console.log("Fetching Meta insights from:", url);
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Meta API error:", response.status, data);
    throw new Error(data.error?.message || `Meta API error: ${response.status}`);
  }

  if (!data.data) {
    console.error("No insights data returned:", data);
    throw new Error("Meta API returned no insights data");
  }

  console.log("✅ Meta insights SUCCESS:", data.data?.length || 0, "days");
  return (data.data || []).map((item: any) => ({
    date: item.date,
    spend: parseFloat(item.spend || "0"),
    impressions: parseInt(item.impressions || "0"),
    clicks: parseInt(item.clicks || "0"),
    reach: 0,
  }));
}

export async function fetchMetaCampaigns(
  accessToken: string,
  accountId: string,
  dateStart: string,
  dateEnd: string
): Promise<CampaignMetrics[]> {
  const url = `${META_GRAPH_API}/${META_API_VERSION}/${accountId}/campaigns?` +
    `fields=id,name,insights{spend,impressions,clicks,actions,action_values}&` +
    `time_range={"since":"${dateStart}","until":"${dateEnd}"}&` +
    `access_token=${accessToken}`;

  console.log("Fetching Meta campaigns from:", url);
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Meta API error:", response.status, data);
    throw new Error(data.error?.message || `Meta API error: ${response.status}`);
  }

  if (!data.data) {
    console.error("No campaigns data returned:", data);
    throw new Error("Meta API returned no campaigns data");
  }

  console.log("✅ Meta campaigns SUCCESS:", data.data?.length || 0, "campaigns");

  return (data.data || []).map((campaign: any) => {
    const insights = campaign.insights?.data?.[0] || {};
    const spend = parseFloat(insights.spend || "0");
    const impressions = parseInt(insights.impressions || "0");
    const clicks = parseInt(insights.clicks || "0");
    const conversions = parseInt(insights.actions?.find((a: any) => a.action_type === "purchase")?.value || "0");
    const conversionValue = parseFloat(insights.action_values?.find((a: any) => a.action_type === "purchase_value")?.value || "0");

    return {
      id: campaign.id,
      name: campaign.name,
      spend,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      conversions,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? conversionValue / spend : 0,
      conversionValue,
    };
  });
}

export function calculateTotals(insights: MetaInsight[]) {
  return {
    spend: insights.reduce((acc, i) => acc + i.spend, 0),
    impressions: insights.reduce((acc, i) => acc + i.impressions, 0),
    clicks: insights.reduce((acc, i) => acc + i.clicks, 0),
    reach: insights.reduce((acc, i) => acc + i.reach, 0),
  };
}

export function calculateMetrics(totals: ReturnType<typeof calculateTotals>) {
  return {
    ...totals,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
  };
}
