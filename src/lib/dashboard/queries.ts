import { AdChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ChannelSummary {
  channel: AdChannel;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

function emptySummary(channel: AdChannel): ChannelSummary {
  return {
    channel,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    conversionValue: 0,
  };
}

async function getSnapshotsSince(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.metricSnapshot.findMany({
    where: { date: { gte: since } },
    include: { campaign: { include: { adAccount: true } } },
    orderBy: { date: "asc" },
  });
}

export async function getChannelSummaries(days = 30): Promise<ChannelSummary[]> {
  const snapshots = await getSnapshotsSince(days);

  const byChannel = new Map<AdChannel, ChannelSummary>();
  for (const channel of Object.values(AdChannel)) {
    byChannel.set(channel, emptySummary(channel));
  }

  for (const snap of snapshots) {
    const channel = snap.campaign.adAccount.channel;
    const summary = byChannel.get(channel)!;
    summary.spend += Number(snap.spend);
    summary.impressions += snap.impressions;
    summary.clicks += snap.clicks;
    summary.conversions += snap.conversions;
    summary.conversionValue += Number(snap.conversionValue ?? 0);
  }

  return Array.from(byChannel.values());
}

export interface DailySpendPoint {
  date: string;
  META: number;
  GOOGLE: number;
  TIKTOK: number;
  SHOPEE: number;
}

export async function getDailySpendSeries(days = 30): Promise<DailySpendPoint[]> {
  const snapshots = await getSnapshotsSince(days);

  const byDate = new Map<string, DailySpendPoint>();

  for (const snap of snapshots) {
    const dateKey = snap.date.toISOString().slice(0, 10);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { date: dateKey, META: 0, GOOGLE: 0, TIKTOK: 0, SHOPEE: 0 });
    }
    const point = byDate.get(dateKey)!;
    const channelKey = snap.campaign.adAccount.channel as keyof Omit<DailySpendPoint, "date">;
    point[channelKey] += Number(snap.spend);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface CampaignRow {
  id: string;
  name: string;
  channel: AdChannel;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number | null;
}

export async function getCampaignTable(days = 30): Promise<CampaignRow[]> {
  const snapshots = await getSnapshotsSince(days);

  const byCampaign = new Map<string, CampaignRow>();

  for (const snap of snapshots) {
    const campaign = snap.campaign;
    if (!byCampaign.has(campaign.id)) {
      byCampaign.set(campaign.id, {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.adAccount.channel,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cpa: null,
      });
    }
    const row = byCampaign.get(campaign.id)!;
    row.spend += Number(snap.spend);
    row.impressions += snap.impressions;
    row.clicks += snap.clicks;
    row.conversions += snap.conversions;
  }

  const rows = Array.from(byCampaign.values());
  for (const row of rows) {
    row.cpa = row.conversions > 0 ? row.spend / row.conversions : null;
  }

  return rows.sort((a, b) => b.spend - a.spend);
}

