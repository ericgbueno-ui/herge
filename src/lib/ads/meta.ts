import type { DailyCampaignMetric } from "./types";
import type { Prisma } from "@prisma/client";

const GRAPH_API_VERSION = "v21.0";
const PURCHASE_ACTION_TYPES = ["offsite_conversion.fb_pixel_purchase", "purchase"];

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  objective?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  date_start: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
}

interface MetaInsightsResponse {
  data: MetaInsightRow[];
  paging?: { next?: string };
}

function sumActionValue(actions: MetaAction[] | undefined, types: string[]): number {
  if (!actions) return 0;
  return actions
    .filter((action) => types.includes(action.action_type))
    .reduce((acc, a) => acc + Number(a.value ?? 0), 0);
}

export async function fetchMetaCampaignInsights(params: {
  accountExternalId: string; // sem prefixo act_
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
  accessToken: string;
}): Promise<DailyCampaignMetric[]> {
  const { accountExternalId, since, until, accessToken } = params;

  const fields = [
    "campaign_id",
    "campaign_name",
    "objective",
    "spend",
    "impressions",
    "clicks",
    "actions",
    "action_values",
  ].join(",");

  const baseUrl = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/act_${accountExternalId}/insights`
  );
  baseUrl.searchParams.set("level", "campaign");
  baseUrl.searchParams.set("fields", fields);
  baseUrl.searchParams.set("time_increment", "1");
  baseUrl.searchParams.set(
    "time_range",
    JSON.stringify({ since, until })
  );
  baseUrl.searchParams.set("limit", "500");
  baseUrl.searchParams.set("access_token", accessToken);

  const results: DailyCampaignMetric[] = [];
  let nextUrl: string | undefined = baseUrl.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Meta Insights API falhou (${res.status}) pra act_${accountExternalId}: ${body}`
      );
    }
    const json = (await res.json()) as MetaInsightsResponse;

    for (const row of json.data) {
      results.push({
        externalCampaignId: row.campaign_id,
        campaignName: row.campaign_name,
        objective: row.objective,
        date: row.date_start,
        spend: Number(row.spend ?? 0),
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        conversions: sumActionValue(row.actions, PURCHASE_ACTION_TYPES),
        conversionValue: sumActionValue(row.action_values, PURCHASE_ACTION_TYPES),
        raw: JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue,
      });
    }

    nextUrl = json.paging?.next;
  }

  return results;
}
