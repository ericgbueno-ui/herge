import { NextRequest, NextResponse } from "next/server";
import { fetchMetaInsights, fetchMetaCampaigns, calculateTotals, calculateMetrics } from "@/lib/meta-ads/insights";

export async function GET(req: NextRequest) {
  try {
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    let accountId = process.env.META_ADS_ACCOUNT_ID;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Meta Ads credentials not configured" },
        { status: 400 }
      );
    }

    // If no accountId, try to discover it
    if (!accountId) {
      const discoverUrl = `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${accessToken}`;
      const discoverRes = await fetch(discoverUrl);
      const discoverData = await discoverRes.json();
      if (discoverData.data?.[0]?.id) {
        accountId = discoverData.data[0].id;
        console.log("Discovered Ad Account:", accountId);
      }
    }

    if (!accountId) {
      return NextResponse.json(
        { error: "Meta Ads account ID not configured and could not be discovered" },
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

    // Check if we got any data
    if (insights.length === 0 && campaigns.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No data received from Meta Ads API. Check your credentials and account permissions."
        },
        { status: 400 }
      );
    }

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
