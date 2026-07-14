import { NextRequest, NextResponse } from "next/server";
import { fetchMetaInsights, fetchMetaCampaigns, calculateTotals, calculateMetrics } from "@/lib/meta-ads/insights";

export async function GET(req: NextRequest) {
  try {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    const accountId = process.env.META_ADS_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      return NextResponse.json(
        { error: "Meta Ads credentials not configured" },
        { status: 400 }
      );
    }

    // Get date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateStart = thirtyDaysAgo.toISOString().split("T")[0];
    const dateEnd = today.toISOString().split("T")[0];

    // Fetch insights and campaigns in parallel
    const [insights, campaigns] = await Promise.all([
      fetchMetaInsights(accessToken, accountId, dateStart, dateEnd),
      fetchMetaCampaigns(accessToken, accountId, dateStart, dateEnd),
    ]);

    // Calculate totals
    const totals = calculateTotals(insights);
    const metrics = calculateMetrics(totals);

    // Sort campaigns by spend (highest first)
    const sortedCampaigns = campaigns.sort((a, b) => b.spend - a.spend);

    return NextResponse.json({
      ok: true,
      dateRange: { start: dateStart, end: dateEnd },
      metrics,
      dailyInsights: insights,
      campaigns: sortedCampaigns,
      summary: {
        totalSpend: metrics.spend,
        totalImpressions: metrics.impressions,
        totalClicks: metrics.clicks,
        totalReach: metrics.reach,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
      },
    });
  } catch (err) {
    console.error("Meta insights error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
