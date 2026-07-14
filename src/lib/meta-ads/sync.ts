import { prisma } from "@/lib/prisma";

const META_API_VERSION = "v21.0";
const META_GRAPH_API = "https://graph.instagram.com";

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
}

interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  purchase_conversions?: number;
  purchase_value?: number;
}

export async function fetchMetaCampaigns(
  accessToken: string,
  adAccountId: string
): Promise<MetaCampaign[]> {
  try {
    const response = await fetch(
      `${META_GRAPH_API}/${META_API_VERSION}/${adAccountId}/campaigns?fields=id,name,status,objective&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error("Meta API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error("Failed to fetch Meta campaigns:", err);
    return [];
  }
}

export async function fetchCampaignInsights(
  accessToken: string,
  campaignId: string,
  dateStart: string,
  dateEnd: string
): Promise<MetaInsights | null> {
  try {
    const response = await fetch(
      `${META_GRAPH_API}/${META_API_VERSION}/${campaignId}/insights?` +
      `fields=spend,impressions,clicks,purchase_conversions,purchase_value` +
      `&date_preset=custom&time_range={"since":"${dateStart}","until":"${dateEnd}"}` +
      `&access_token=${accessToken}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    return data.data[0];
  } catch (err) {
    console.error("Failed to fetch campaign insights:", err);
    return null;
  }
}

export async function syncMetaAdAccountCampaigns(
  userId: string,
  adAccountId: string,
  accessToken: string
) {
  try {
    // Fetch campaigns from Meta API
    const campaigns = await fetchMetaCampaigns(accessToken, adAccountId);

    if (campaigns.length === 0) {
      console.log(`No campaigns found for account ${adAccountId}`);
      return { synced: 0, errors: 0 };
    }

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateStart = startDate.toISOString().split("T")[0];
    const dateEnd = endDate.toISOString().split("T")[0];

    let synced = 0;
    let errors = 0;

    // Sync each campaign
    for (const metaCampaign of campaigns) {
      try {
        // Upsert campaign in database
        const campaign = await prisma.campaign.upsert({
          where: {
            externalId: metaCampaign.id,
          },
          update: {
            name: metaCampaign.name,
            status: metaCampaign.status,
          },
          create: {
            externalId: metaCampaign.id,
            name: metaCampaign.name,
            status: metaCampaign.status,
            adAccountId: adAccountId,
          },
        });

        // Fetch insights from Meta API
        const insights = await fetchCampaignInsights(
          accessToken,
          metaCampaign.id,
          dateStart,
          dateEnd
        );

        if (insights) {
          // Create metric snapshot
          await prisma.metricSnapshot.create({
            data: {
              campaignId: campaign.id,
              date: new Date(),
              spend: parseFloat(String(insights.spend ?? "0")),
              impressions: parseInt(String(insights.impressions ?? "0")),
              clicks: parseInt(String(insights.clicks ?? "0")),
              conversions: parseInt(String(insights.purchase_conversions ?? "0")),
              conversionValue: parseFloat(String(insights.purchase_value ?? "0")),
            },
          });

          synced++;
        }
      } catch (err) {
        console.error(`Error syncing campaign ${metaCampaign.id}:`, err);
        errors++;
      }
    }

    // Update last synced time
    await prisma.adAccount.update({
      where: { externalId: adAccountId },
      data: { lastSyncedAt: new Date() },
    });

    return { synced, errors };
  } catch (err) {
    console.error("Failed to sync Meta campaigns:", err);
    return { synced: 0, errors: 1 };
  }
}
