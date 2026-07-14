import { AdChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdAccountRef, DailyCampaignMetric } from "./types";

export async function upsertDailyMetrics(
  channel: AdChannel,
  account: AdAccountRef,
  metrics: DailyCampaignMetric[]
) {
  const adAccount = await prisma.adAccount.upsert({
    where: {
      channel_externalAccountId: {
        channel,
        externalAccountId: account.externalAccountId,
      },
    },
    update: { name: account.name, loginCustomerId: account.loginCustomerId },
    create: {
      channel,
      externalAccountId: account.externalAccountId,
      name: account.name,
      loginCustomerId: account.loginCustomerId,
    },
  });

  const campaignCache = new Map<string, string>(); // externalCampaignId -> campaignId

  for (const metric of metrics) {
    let campaignId = campaignCache.get(metric.externalCampaignId);

    if (!campaignId) {
      const campaign = await prisma.campaign.upsert({
        where: {
          adAccountId_externalCampaignId: {
            adAccountId: adAccount.id,
            externalCampaignId: metric.externalCampaignId,
          },
        },
        update: { name: metric.campaignName, objective: metric.objective },
        create: {
          adAccountId: adAccount.id,
          externalCampaignId: metric.externalCampaignId,
          name: metric.campaignName,
          objective: metric.objective,
        },
      });
      campaignId = campaign.id;
      campaignCache.set(metric.externalCampaignId, campaignId as string);
    }

    await prisma.metricSnapshot.upsert({
      where: {
        campaignId_date: {
          campaignId,
          date: new Date(metric.date),
        },
      },
      update: {
        spend: metric.spend,
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        conversionValue: metric.conversionValue,
        raw: metric.raw as object,
      },
      create: {
        campaignId,
        date: new Date(metric.date),
        spend: metric.spend,
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        conversionValue: metric.conversionValue,
        raw: metric.raw as object,
      },
    });
  }

  return { adAccountId: adAccount.id, campaignsProcessed: campaignCache.size };
}
