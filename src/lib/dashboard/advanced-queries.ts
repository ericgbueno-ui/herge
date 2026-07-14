import { AdChannel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PeriodType = "today" | "7d" | "30d" | "thisMonth" | "lastMonth" | "custom";

function getPeriodDates(period: PeriodType, customFrom?: Date, customTo?: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let from: Date, to: Date;

  switch (period) {
    case "today":
      from = new Date(today);
      to = new Date(today);
      to.setDate(to.getDate() + 1);
      break;

    case "7d":
      from = new Date(today);
      from.setDate(from.getDate() - 6);
      to = new Date(today);
      to.setDate(to.getDate() + 1);
      break;

    case "30d":
      from = new Date(today);
      from.setDate(from.getDate() - 29);
      to = new Date(today);
      to.setDate(to.getDate() + 1);
      break;

    case "thisMonth":
      from = new Date(today);
      from.setDate(1);
      to = new Date(from);
      to.setMonth(to.getMonth() + 1);
      break;

    case "lastMonth":
      from = new Date(today);
      from.setDate(1);
      from.setMonth(from.getMonth() - 1);
      to = new Date(from);
      to.setMonth(to.getMonth() + 1);
      break;

    case "custom":
      if (!customFrom || !customTo) throw new Error("custom period requires customFrom and customTo");
      from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      break;

    default:
      throw new Error(`Unknown period: ${period}`);
  }

  return { from, to };
}

export interface CampaignPerformance {
  id: string;
  name: string;
  channel: AdChannel;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export async function getCampaignPerformance(
  period: PeriodType,
  customFrom?: Date,
  customTo?: Date
): Promise<CampaignPerformance[]> {
  const { from, to } = getPeriodDates(period, customFrom, customTo);

  const snapshots = await prisma.metricSnapshot.findMany({
    where: { date: { gte: from, lte: to } },
    include: { campaign: { include: { adAccount: true } } },
  });

  const byCampaign = new Map<string, CampaignPerformance>();

  for (const snap of snapshots) {
    const campaign = snap.campaign;
    if (!byCampaign.has(campaign.id)) {
      byCampaign.set(campaign.id, {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.adAccount.channel as AdChannel,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionValue: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      });
    }

    const perf = byCampaign.get(campaign.id)!;
    perf.spend += Number(snap.spend);
    perf.impressions += snap.impressions;
    perf.clicks += snap.clicks;
    perf.conversions += snap.conversions;
    perf.conversionValue += Number(snap.conversionValue ?? 0);
  }

  // Calcular métricas derivadas
  for (const perf of byCampaign.values()) {
    perf.ctr = perf.impressions > 0 ? (perf.clicks / perf.impressions) * 100 : 0;
    perf.cpc = perf.clicks > 0 ? perf.spend / perf.clicks : 0;
    perf.cpa = perf.conversions > 0 ? perf.spend / perf.conversions : 0;
    perf.roas = perf.spend > 0 ? perf.conversionValue / perf.spend : 0;
  }

  return Array.from(byCampaign.values()).sort((a, b) => b.spend - a.spend);
}

export interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
}

export async function getConversionFunnel(
  period: PeriodType,
  customFrom?: Date,
  customTo?: Date
): Promise<FunnelStep[]> {
  const perf = await getCampaignPerformance(period, customFrom, customTo);

  const totalImpressions = perf.reduce((acc, p) => acc + p.impressions, 0);
  const totalClicks = perf.reduce((acc, p) => acc + p.clicks, 0);
  const totalConversions = perf.reduce((acc, p) => acc + p.conversions, 0);

  return [
    { label: "Impressões", value: totalImpressions, percentage: 100 },
    { label: "Cliques", value: totalClicks, percentage: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0 },
    { label: "Conversões", value: totalConversions, percentage: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0 },
  ];
}

export interface BenchmarkRanking {
  rank: number;
  campaignName: string;
  channel: AdChannel;
  cpa: number;
  roas: number;
}

export async function getBenchmarkRanking(
  period: PeriodType,
  customFrom?: Date,
  customTo?: Date
): Promise<BenchmarkRanking[]> {
  const perf = await getCampaignPerformance(period, customFrom, customTo);

  return perf
    .filter((p: any) => p.conversions > 0) // Só campanhas que tiveram conversões
    .sort((a, b) => a.cpa - b.cpa) // Menor CPA primeiro (mais eficiente)
    .map((p, idx) => ({
      rank: idx + 1,
      campaignName: p.name,
      channel: p.channel,
      cpa: p.cpa,
      roas: p.roas,
    }));
}
