import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const alerts: string[] = [];

  // Detectar anomalias nas últimas 24h
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const snapshots = await prisma.metricSnapshot.findMany({
    where: { date: { gte: yesterday } },
    include: { campaign: true },
  });

  // Agrupar por campanha
  const byCampaign = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    if (!byCampaign.has(snap.campaignId)) {
      byCampaign.set(snap.campaignId, []);
    }
    byCampaign.get(snap.campaignId)!.push(snap);
  }

  // Analisar cada campanha
  for (const [campaignId, snaps] of byCampaign) {
    const campaign = snaps[0].campaign;

    // 1. CPA spike (>20% vs. período anterior)
    if (snaps.length >= 2) {
      const today = snaps[snaps.length - 1];
      const yesterday_snap = snaps[snaps.length - 2];

      const todaySpend = Number(today.spend);
      const todayConversions = today.conversions;
      const todayCPA = todayConversions > 0 ? todaySpend / todayConversions : 0;

      const yesterdaySpend = Number(yesterday_snap.spend);
      const yesterdayConversions = yesterday_snap.conversions;
      const yesterdayCPA = yesterdayConversions > 0 ? yesterdaySpend / yesterdayConversions : 0;

      if (yesterdayCPA > 0) {
        const cpaDiff = ((todayCPA - yesterdayCPA) / yesterdayCPA) * 100;
        if (cpaDiff > 20) {
          await prisma.alert.create({
            data: {
              campaignId,
              severity: "WARNING",
              type: "cpa_spike",
              message: `CPA subiu ${cpaDiff.toFixed(1)}% em relação a ontem`,
              threshold: new Prisma.Decimal(yesterdayCPA * 1.2),
              currentValue: new Prisma.Decimal(todayCPA),
            },
          });
          alerts.push(`[CPA SPIKE] ${campaign.name}: ${cpaDiff.toFixed(1)}%`);
        }
      }
    }

    // 2. CTR drop (>15% vs. período anterior)
    if (snaps.length >= 2) {
      const today = snaps[snaps.length - 1];
      const yesterday_snap = snaps[snaps.length - 2];

      const todayCTR = today.impressions > 0 ? (today.clicks / today.impressions) * 100 : 0;
      const yesterdayCTR =
        yesterday_snap.impressions > 0 ? (yesterday_snap.clicks / yesterday_snap.impressions) * 100 : 0;

      if (yesterdayCTR > 0) {
        const ctrDiff = ((yesterdayCTR - todayCTR) / yesterdayCTR) * 100;
        if (ctrDiff > 15) {
          await prisma.alert.create({
            data: {
              campaignId,
              severity: "INFO",
              type: "ctr_drop",
              message: `CTR caiu ${ctrDiff.toFixed(1)}% em relação a ontem`,
              threshold: new Prisma.Decimal(yesterdayCTR * 0.85),
              currentValue: new Prisma.Decimal(todayCTR),
            },
          });
          alerts.push(`[CTR DROP] ${campaign.name}: ${ctrDiff.toFixed(1)}%`);
        }
      }
    }

    // 3. No conversions for 3+ days
    const last3Days = snaps.slice(-3);
    if (last3Days.length === 3 && last3Days.every((s: any) => s.conversions === 0)) {
      await prisma.alert.create({
        data: {
          campaignId,
          severity: "CRITICAL",
          type: "no_conversions",
          message: "Nenhuma conversão nos últimos 3 dias",
        },
      });
      alerts.push(`[NO CONVERSIONS] ${campaign.name}`);
    }
  }

  return NextResponse.json({
    ok: true,
    alerts_generated: alerts.length,
    details: alerts,
  });
}
