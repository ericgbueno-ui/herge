const META_API_VERSION = "v21.0";
const META_GRAPH_API = "https://graph.instagram.com";

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
  try {
    const response = await fetch(
      `${META_GRAPH_API}/${META_API_VERSION}/${accountId}/insights?` +
      `fields=spend,impressions,clicks,reach&` +
      `time_increment=1&` +
      `date_preset=custom&` +
      `time_range={"since":"${dateStart}","until":"${dateEnd}"}&` +
      `access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error("Meta API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return (data.data || []).map((item: any) => ({
      date: item.date,
      spend: parseFloat(item.spend || "0"),
      impressions: parseInt(item.impressions || "0"),
      clicks: parseInt(item.clicks || "0"),
      reach: parseInt(item.reach || "0"),
    }));
  } catch (err) {
    console.error("Failed to fetch Meta insights:", err);
    return [];
  }
}

export async function fetchMetaCampaigns(
  accessToken: string,
  accountId: string,
  dateStart: string,
  dateEnd: string
): Promise<CampaignMetrics[]> {
  try {
    const response = await fetch(
      `${META_GRAPH_API}/${META_API_VERSION}/${accountId}/campaigns?` +
      `fields=id,name,insights{spend,impressions,clicks,actions,action_values}&` +
      `time_range={"since":"${dateStart}","until":"${dateEnd}"}&` +
      `access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error("Meta API error:", response.statusText);
      return [];
    }

    const data = await response.json();

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
  } catch (err) {
    console.error("Failed to fetch Meta campaigns:", err);
    return [];
  }
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
