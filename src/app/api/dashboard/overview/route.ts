import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CHANNEL_LABEL: Record<string, string> = {
  META: "Meta Ads",
  GOOGLE: "Google Ads",
  TIKTOK: "TikTok Ads",
  SHOPEE: "Shopee Ads",
};

function pctDelta(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * GET /api/dashboard/overview?days=30
 * Visão geral agregada de todos os canais (Meta, Google, TikTok, Shopee)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") || "30"), 90);
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - days);
    const prevStart = new Date(periodStart);
    prevStart.setDate(prevStart.getDate() - days);

    const [
      snapshots,
      prevSnapshots,
      leadsCount,
      prevLeadsCount,
      salesAgg,
      prevSalesAgg,
      salesByCompany,
      companies,
      recentSales,
      recentLeads,
      recentConversations,
      qualifiedLeads,
      conversationsCount,
      completedSales,
      leadsByCampaign,
      salesByCampaign,
      prevSalesByCompany,
    ] = await Promise.all([
      prisma.metricSnapshot.findMany({
        where: { date: { gte: periodStart } },
        select: {
          date: true,
          spend: true,
          clicks: true,
          impressions: true,
          conversions: true,
          conversionValue: true,
          campaign: {
            select: {
              id: true,
              name: true,
              adAccount: { select: { channel: true } },
            },
          },
        },
      }),
      prisma.metricSnapshot.aggregate({
        where: { date: { gte: prevStart, lt: periodStart } },
        _sum: { spend: true, conversionValue: true, clicks: true, impressions: true },
      }),
      prisma.lead.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: prevStart, lt: periodStart } } }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: periodStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: prevStart, lt: periodStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.groupBy({
        by: ["companyId"],
        where: { createdAt: { gte: periodStart } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      prisma.company.findMany({ select: { id: true, name: true, segment: true } }),
      prisma.sale.findMany({
        where: { createdAt: { gte: periodStart } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { createdAt: true, company: { select: { name: true } } },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: periodStart } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { createdAt: true, name: true, company: { select: { name: true } } },
      }),
      prisma.whatsAppConversation.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { createdAt: true, company: { select: { name: true } } },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: periodStart }, estimatedValue: { not: null } },
      }),
      prisma.whatsAppConversation.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.sale.count({
        where: { createdAt: { gte: periodStart }, paymentStatus: "completed" },
      }),
      prisma.lead.groupBy({
        by: ["campaignId"],
        where: { createdAt: { gte: periodStart }, campaignId: { not: null } },
        _count: true,
      }),
      prisma.sale.groupBy({
        by: ["campaignId"],
        where: { createdAt: { gte: periodStart }, campaignId: { not: null } },
        _count: true,
      }),
      prisma.sale.groupBy({
        by: ["companyId"],
        where: { createdAt: { gte: prevStart, lt: periodStart } },
        _sum: { amount: true },
      }),
    ]);

    // --- KPIs ---
    const investment = snapshots.reduce((acc, s) => acc + Number(s.spend), 0);
    const adRevenue = snapshots.reduce((acc, s) => acc + Number(s.conversionValue || 0), 0);
    const salesRevenue = Number(salesAgg._sum.amount || 0);
    const revenue = salesRevenue > 0 ? salesRevenue : adRevenue;

    const prevInvestment = Number(prevSnapshots._sum.spend || 0);
    const prevAdRevenue = Number(prevSnapshots._sum.conversionValue || 0);
    const prevSalesRevenue = Number(prevSalesAgg._sum.amount || 0);
    const prevRevenue = prevSalesRevenue > 0 ? prevSalesRevenue : prevAdRevenue;

    const salesCount = salesAgg._count;
    const prevSalesCount = prevSalesAgg._count;
    const roas = investment > 0 ? revenue / investment : 0;
    const prevRoas = prevInvestment > 0 ? prevRevenue / prevInvestment : 0;
    const convRate = leadsCount > 0 ? (salesCount / leadsCount) * 100 : 0;
    const prevConvRate = prevLeadsCount > 0 ? (prevSalesCount / prevLeadsCount) * 100 : 0;

    // --- Série diária (receita vs investimento) ---
    const byDay = new Map<string, { receita: number; investimento: number }>();
    for (const s of snapshots) {
      const key = s.date.toISOString().slice(0, 10);
      const entry = byDay.get(key) || { receita: 0, investimento: 0 };
      entry.investimento += Number(s.spend);
      entry.receita += Number(s.conversionValue || 0);
      byDay.set(key, entry);
    }
    const series = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
        receita: Math.round(v.receita),
        investimento: Math.round(v.investimento),
      }));

    // --- Distribuição por canal (share de investimento) ---
    const byChannel = new Map<string, number>();
    for (const s of snapshots) {
      const ch = s.campaign.adAccount.channel;
      byChannel.set(ch, (byChannel.get(ch) || 0) + Number(s.spend));
    }
    const channelTotal = [...byChannel.values()].reduce((a, b) => a + b, 0);
    const channels = [...byChannel.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([ch, spend]) => ({
        name: CHANNEL_LABEL[ch] || ch,
        channel: ch,
        value: channelTotal > 0 ? Math.round((spend / channelTotal) * 100) : 0,
      }));

    // --- Campanhas (top 5 por investimento) ---
    const byCampaign = new Map<
      string,
      { name: string; channel: string; spend: number; conversions: number; revenue: number }
    >();
    for (const s of snapshots) {
      const entry =
        byCampaign.get(s.campaign.id) || {
          name: s.campaign.name,
          channel: s.campaign.adAccount.channel,
          spend: 0,
          conversions: 0,
          revenue: 0,
        };
      entry.spend += Number(s.spend);
      entry.conversions += s.conversions;
      entry.revenue += Number(s.conversionValue || 0);
      byCampaign.set(s.campaign.id, entry);
    }
    const leadsPerCampaign = new Map(leadsByCampaign.map((l) => [l.campaignId, l._count]));
    const salesPerCampaign = new Map(salesByCampaign.map((s) => [s.campaignId, s._count]));
    const topCampaigns = [...byCampaign.entries()]
      .sort(([, a], [, b]) => b.spend - a.spend)
      .slice(0, 5)
      .map(([id, c]) => {
        const sales = salesPerCampaign.get(id) || c.conversions;
        return {
          id,
          name: c.name,
          channel: c.channel,
          invest: c.spend,
          leads: leadsPerCampaign.get(id) || 0,
          sales,
          revenue: c.revenue,
          roas: c.spend > 0 ? c.revenue / c.spend : 0,
          cpa: sales > 0 ? c.spend / sales : 0,
        };
      });

    // --- Ranking de empresas ---
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const prevByCompany = new Map(
      prevSalesByCompany.map((s) => [s.companyId, Number(s._sum.amount || 0)])
    );
    const topCompanies = salesByCompany.map((s) => {
      const company = companyMap.get(s.companyId);
      const current = Number(s._sum.amount || 0);
      return {
        name: company?.name || "—",
        segment: company?.segment || "",
        revenue: current,
        delta: pctDelta(current, prevByCompany.get(s.companyId) || 0),
      };
    });

    // --- Funil ---
    const funnel = [
      { label: "Leads", value: leadsCount },
      { label: "Orçamentos", value: qualifiedLeads },
      { label: "Negociação", value: conversationsCount },
      { label: "Vendas", value: salesCount },
      { label: "Pós Venda", value: completedSales },
    ];

    // --- Atividades recentes ---
    const activities = [
      ...recentConversations.map((c) => ({
        type: "conversation",
        title: "Nova conversa iniciada",
        detail: c.company?.name || "WhatsApp",
        at: c.createdAt,
      })),
      ...recentSales.map((s) => ({
        type: "sale",
        title: "Venda concluída",
        detail: s.company?.name || "—",
        at: s.createdAt,
      })),
      ...recentLeads.map((l) => ({
        type: "lead",
        title: "Novo lead recebido",
        detail: l.company?.name || l.name,
        at: l.createdAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5);

    // --- Métricas de mídia (CPC, CTR, CPM, ticket médio) ---
    const clicks = snapshots.reduce((acc, s) => acc + s.clicks, 0);
    const impressions = snapshots.reduce((acc, s) => acc + s.impressions, 0);
    const prevClicks = Number(prevSnapshots._sum.clicks || 0);
    const prevImpressions = Number(prevSnapshots._sum.impressions || 0);

    const cpc = clicks > 0 ? investment / clicks : 0;
    const prevCpc = prevClicks > 0 ? prevInvestment / prevClicks : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
    const cpm = impressions > 0 ? (investment / impressions) * 1000 : 0;
    const prevCpm = prevImpressions > 0 ? (prevInvestment / prevImpressions) * 1000 : 0;
    const ticket = salesCount > 0 ? revenue / salesCount : 0;
    const prevTicket = prevSalesCount > 0 ? prevRevenue / prevSalesCount : 0;

    const hasData =
      snapshots.length > 0 || leadsCount > 0 || salesCount > 0 || activities.length > 0;

    return NextResponse.json({
      metrics: {
        cpc: { value: cpc, delta: pctDelta(cpc, prevCpc) },
        ctr: { value: ctr, delta: pctDelta(ctr, prevCtr) },
        cpm: { value: cpm, delta: pctDelta(cpm, prevCpm) },
        ticket: { value: ticket, delta: pctDelta(ticket, prevTicket) },
      },
      ok: true,
      hasData,
      kpis: {
        investment: { value: investment, delta: pctDelta(investment, prevInvestment) },
        revenue: { value: revenue, delta: pctDelta(revenue, prevRevenue) },
        roas: { value: roas, delta: pctDelta(roas, prevRoas) },
        leads: { value: leadsCount, delta: pctDelta(leadsCount, prevLeadsCount) },
        sales: { value: salesCount, delta: pctDelta(salesCount, prevSalesCount) },
        conversionRate: { value: convRate, delta: pctDelta(convRate, prevConvRate) },
      },
      series,
      channels,
      campaigns: topCampaigns,
      companies: topCompanies,
      funnel,
      activities,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
