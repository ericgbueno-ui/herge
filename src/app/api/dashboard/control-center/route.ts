import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const memberships = await prisma.companyUser.findMany({
    where: { userId: session.user.id },
    select: { companyId: true, company: { select: { id: true, name: true, segment: true } } },
  });
  const allowedIds = memberships.map((item) => item.companyId);
  const requestedCompanyId = req.nextUrl.searchParams.get("companyId");
  if (requestedCompanyId && !allowedIds.includes(requestedCompanyId)) {
    return NextResponse.json({ error: "Acesso negado à empresa" }, { status: 403 });
  }

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days") || 30), 1), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const scopeIds = requestedCompanyId ? [requestedCompanyId] : allowedIds;
  const companyFilter = { companyId: { in: scopeIds } };
  const trusted = { dataOrigin: { not: "DEMO" as const } };

  const [accounts, snapshots, leads, sales, conversations, integrations, campaigns] = await Promise.all([
    prisma.adAccount.findMany({
      where: companyFilter,
      select: { id: true, companyId: true, channel: true, name: true, externalAccountId: true, lastSyncedAt: true },
    }),
    prisma.metricSnapshot.findMany({
      where: { ...trusted, date: { gte: since }, campaign: companyFilter },
      select: { spend: true, impressions: true, clicks: true, conversions: true, conversionValue: true, campaignId: true, campaign: { select: { companyId: true, name: true, adAccount: { select: { channel: true } } } } },
    }),
    prisma.lead.findMany({ where: { ...companyFilter, ...trusted, createdAt: { gte: since } }, select: { companyId: true } }),
    prisma.sale.findMany({ where: { ...companyFilter, ...trusted, paymentStatus: "completed", createdAt: { gte: since } }, select: { companyId: true, campaignId: true, amount: true, profit: true } }),
    prisma.whatsAppConversation.count({ where: { ...companyFilter, createdAt: { gte: since } } }),
    prisma.companyIntegration.findMany({ where: companyFilter, select: { companyId: true, type: true, status: true, lastSyncAt: true, lastError: true } }),
    prisma.campaign.count({ where: companyFilter }),
  ]);

  const spend = snapshots.reduce((sum, row) => sum + Number(row.spend), 0);
  const revenue = sales.reduce((sum, row) => sum + Number(row.amount), 0);
  const impressions = snapshots.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = snapshots.reduce((sum, row) => sum + row.clicks, 0);
  const confirmedSales = sales.length;
  const knownSalesProfit = sales.filter((row) => row.profit !== null);
  const grossSalesProfit = knownSalesProfit.reduce((sum, row) => sum + Number(row.profit), 0);

  const channelMap = new Map<string, { spend: number; impressions: number; clicks: number }>();
  for (const row of snapshots) {
    const channel = row.campaign.adAccount.channel;
    const current = channelMap.get(channel) || { spend: 0, impressions: 0, clicks: 0 };
    current.spend += Number(row.spend);
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    channelMap.set(channel, current);
  }

  const companyById = new Map(memberships.map((item) => [item.company.id, item.company]));
  const portfolio = scopeIds.map((companyId) => {
    const companyAccounts = accounts.filter((row) => row.companyId === companyId);
    const companySnapshots = snapshots.filter((row) => row.campaign.companyId === companyId);
    const companyLeads = leads.filter((row) => row.companyId === companyId);
    const companySales = sales.filter((row) => row.companyId === companyId);
    const companyIntegrations = integrations.filter((row) => row.companyId === companyId);
    const companySpend = companySnapshots.reduce((sum, row) => sum + Number(row.spend), 0);
    const companyRevenue = companySales.reduce((sum, row) => sum + Number(row.amount), 0);
    return {
      ...companyById.get(companyId),
      accounts: companyAccounts.length,
      channels: [...new Set(companyAccounts.map((row) => row.channel))],
      campaigns: new Set(companySnapshots.map((row) => row.campaignId)).size,
      spend: companySpend,
      leads: companyLeads.length,
      sales: companySales.length,
      revenue: companyRevenue,
      roas: companySpend > 0 && companySales.length > 0 ? companyRevenue / companySpend : null,
      integrationErrors: companyIntegrations.filter((row) => row.status === "error" || row.lastError).length,
      lastSyncAt: companyAccounts.map((row) => row.lastSyncedAt).filter(Boolean).sort().at(-1) || null,
    };
  });

  const campaignMap = new Map<string, { id: string; name: string; companyId: string | null; channel: string; spend: number; impressions: number; clicks: number; platformConversions: number; platformConversionValue: number }>();
  for (const row of snapshots) {
    const current = campaignMap.get(row.campaignId) || { id: row.campaignId, name: row.campaign.name, companyId: row.campaign.companyId, channel: row.campaign.adAccount.channel, spend: 0, impressions: 0, clicks: 0, platformConversions: 0, platformConversionValue: 0 };
    current.spend += Number(row.spend);
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    current.platformConversions += row.conversions;
    current.platformConversionValue += Number(row.conversionValue || 0);
    campaignMap.set(row.campaignId, current);
  }
  const campaignPerformance = [...campaignMap.values()].map((campaign) => {
    const attributedSales = sales.filter((sale) => sale.campaignId === campaign.id);
    const campaignRevenue = attributedSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
    const salesWithProfit = attributedSales.filter((sale) => sale.profit !== null);
    const profitKnown = attributedSales.length > 0 && salesWithProfit.length === attributedSales.length;
    const salesProfit = salesWithProfit.reduce((sum, sale) => sum + Number(sale.profit), 0);
    return {
      ...campaign,
      companyName: campaign.companyId ? companyById.get(campaign.companyId)?.name || "—" : "—",
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
      cpc: campaign.clicks > 0 ? campaign.spend / campaign.clicks : null,
      costPerPlatformResult: campaign.platformConversions > 0 ? campaign.spend / campaign.platformConversions : null,
      sales: attributedSales.length,
      revenue: campaignRevenue,
      roas: campaign.spend > 0 && attributedSales.length > 0 ? campaignRevenue / campaign.spend : null,
      cpa: attributedSales.length > 0 ? campaign.spend / attributedSales.length : null,
      profitKnown,
      netProfit: profitKnown ? salesProfit - campaign.spend : null,
    };
  }).sort((a, b) => b.spend - a.spend);

  return NextResponse.json({
    ok: true,
    scope: requestedCompanyId ? "company" : "portfolio",
    selectedCompanyId: requestedCompanyId,
    days,
    companies: memberships.map((item) => item.company).sort((a, b) => a.name.localeCompare(b.name)),
    summary: {
      companies: scopeIds.length,
      adAccounts: accounts.length,
      campaigns,
      spend,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      leads: leads.length,
      conversations,
      sales: confirmedSales,
      revenue,
      profitKnown: sales.length > 0 && knownSalesProfit.length === sales.length,
      netProfit: sales.length > 0 && knownSalesProfit.length === sales.length ? grossSalesProfit - spend : null,
      roas: spend > 0 && confirmedSales > 0 ? revenue / spend : null,
      connectedIntegrations: integrations.filter((row) => row.status === "connected").length,
      integrationErrors: integrations.filter((row) => row.status === "error" || row.lastError).length,
    },
    channels: [...channelMap.entries()].map(([channel, values]) => ({ channel, ...values, ctr: values.impressions > 0 ? (values.clicks / values.impressions) * 100 : 0 })),
    campaignPerformance,
    portfolio,
  });
}
