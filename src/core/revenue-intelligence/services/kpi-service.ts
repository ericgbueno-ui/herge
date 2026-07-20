/**
 * KPI SERVICE
 * Calcula indicadores de performance
 * Responde: qual campanha gera mais lucro? qual canal tem melhor ROI?
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface KPIMetrics {
  // Funil
  impressions: number;
  clicks: number;
  leads: number;
  qualified: number;
  deals: number;
  sales: number;
  customers: number;

  // Taxa de conversão
  clickThroughRate: number; // clicks / impressions
  costPerClick: number; // spend / clicks
  costPerLead: number; // spend / leads
  conversionRate: number; // sales / leads
  customerAcquisitionCost: number; // spend / customers

  // Financeiro
  spend: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  marginPercent: number;

  // Retorno
  roas: number; // revenue / spend
  roi: number; // profit / spend
  ltv: number; // customer lifetime value (médio)
  cltv: number; // customer LTV / CAC

  // Ticket
  averageTicket: number; // revenue / sales
  averageOrderValue: number;
}

export class KPIService {
  /**
   * Calcula KPIs para uma empresa em um período
   */
  async calculateKPIs(
    companyId: string,
    startDate: Date,
    endDate: Date,
    groupBy?: string // channel|campaign|product
  ): Promise<KPIMetrics> {
    // 1. Busca dados de funil
    const funnel = await this.getFunnelData(companyId, startDate, endDate, groupBy);

    // 2. Busca dados financeiros
    const financials = await this.getFinancialData(companyId, startDate, endDate, groupBy);

    // 3. Calcula métricas
    const metrics = this.computeMetrics(funnel, financials);

    // 4. Cache resultado
    await this.cacheKPISnapshot(companyId, metrics, startDate, endDate);

    return metrics;
  }

  /**
   * Calcula KPI para uma campanha específica
   * Responde: "Qual é o ROI da campanha X?"
   */
  async getCampaignKPI(campaignId: string): Promise<KPIMetrics> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        snapshots: { where: { dataOrigin: { not: 'DEMO' } } },
        conversions: { where: { dataOrigin: { not: 'DEMO' } } },
        leads: { where: { dataOrigin: { not: 'DEMO' } } },
        sales: { where: { dataOrigin: { not: 'DEMO' }, paymentStatus: 'completed' } },
      },
    });

    if (!campaign) throw new Error('Campanha não encontrada');

    // Agrega dados
    const totalSpend = campaign.snapshots.reduce(
      (sum, s) => sum + Number(s.spend || 0),
      0
    );
    const totalImpressions = campaign.snapshots.reduce((sum, s) => sum + s.impressions, 0);
    const totalClicks = campaign.snapshots.reduce((sum, s) => sum + s.clicks, 0);
    const totalConversions = campaign.snapshots.reduce((sum, s) => sum + s.conversions, 0);
    const totalRevenue = campaign.sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

    return {
      impressions: totalImpressions,
      clicks: totalClicks,
      leads: campaign.leads.length,
      qualified: 0,
      deals: 0,
      sales: campaign.sales.length,
      customers: campaign.sales.length,
      clickThroughRate: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      costPerClick: totalClicks > 0 ? totalSpend / totalClicks : 0,
      costPerLead: campaign.leads.length > 0 ? totalSpend / campaign.leads.length : 0,
      conversionRate: campaign.leads.length > 0 ? campaign.sales.length / campaign.leads.length : 0,
      customerAcquisitionCost: campaign.sales.length > 0 ? totalSpend / campaign.sales.length : 0,
      spend: totalSpend,
      revenue: totalRevenue,
      grossProfit: totalRevenue - totalSpend,
      netProfit: campaign.sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0),
      marginPercent: totalRevenue > 0 ? ((totalRevenue - totalSpend) / totalRevenue) * 100 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      roi: totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
      ltv: 0,
      cltv: 0,
      averageTicket: campaign.sales.length > 0 ? totalRevenue / campaign.sales.length : 0,
      averageOrderValue: campaign.sales.length > 0 ? totalRevenue / campaign.sales.length : 0,
    };
  }

  /**
   * Ranking de campanhas por lucro
   * Responde: "Qual campanha gera mais lucro?"
   */
  async rankCampaignsByProfit(companyId: string, limit: number = 10): Promise<any[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { companyId },
      include: {
        snapshots: {
          select: { spend: true, conversionValue: true },
        },
        sales: {
          select: { amount: true, profit: true },
        },
      },
    });

    const ranked = campaigns
      .map((c) => {
        const totalSpend = c.snapshots.reduce((sum, s) => sum + Number(s.spend || 0), 0);
        const totalProfit = c.sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);

        return {
          campaignId: c.id,
          campaignName: c.name,
          totalProfit,
          totalSpend,
          roi: totalSpend > 0 ? ((totalProfit / totalSpend) * 100).toFixed(2) : 0,
          salesCount: c.sales.length,
        };
      })
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, limit);

    return ranked;
  }

  /**
   * Ranking de vendedores por conversão
   * Responde: "Qual vendedor converte melhor?"
   */
  async rankSellersByConversion(companyId: string): Promise<any[]> {
    // TODO: Implementar quando houver field salePersonId em Deal

    return [];
  }

  /**
   * Ranking de produtos mais vendidos
   * Responde: "Qual produto gera maior receita?"
   */
  async rankProductsByRevenue(companyId: string, limit: number = 10): Promise<any[]> {
    const products = await prisma.saleProduct.groupBy({
      by: ['productId'],
      where: { companyId },
      _sum: { totalPrice: true },
      _count: true,
    });

    return products
      .map((p) => ({
        productId: p.productId,
        revenue: Number(p._sum.totalPrice || 0),
        quantity: p._count,
        averagePrice: Number(p._sum.totalPrice || 0) / p._count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Comparativo período a período
   * Responde: "Melhoramos em relação ao mês passado?"
   */
  async comparePeriods(
    companyId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<{
    period1: KPIMetrics;
    period2: KPIMetrics;
    change: Record<string, number>;
  }> {
    const period1 = await this.calculateKPIs(companyId, period1Start, period1End);
    const period2 = await this.calculateKPIs(companyId, period2Start, period2End);

    const change = {
      revenueChange: ((period2.revenue - period1.revenue) / period1.revenue) * 100,
      profitChange: ((period2.netProfit - period1.netProfit) / period1.netProfit) * 100,
      roasChange: period2.roas - period1.roas,
      roiChange: period2.roi - period1.roi,
      leadChange: period2.leads - period1.leads,
    };

    return { period1, period2, change };
  }

  /**
   * Custo de aquisição de cliente por canal
   * Responde: "Qual canal tem menor CAC?"
   */
  async getCACByChannel(companyId: string): Promise<Record<string, number>> {
    const data = await prisma.customer.groupBy({
      by: ['leadId'],
      where: { companyId },
      _sum: { totalSpent: true },
    });

    // TODO: Completar com dados de channel de attribution

    return {};
  }

  // === MÉTODOS PRIVADOS ===

  private async getFunnelData(
    companyId: string,
    startDate: Date,
    endDate: Date,
    groupBy?: string
  ): Promise<any> {
    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        dataOrigin: { not: 'DEMO' },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true },
    });

    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        dataOrigin: { not: 'DEMO' },
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'completed',
      },
    });

    return {
      leads: leads.length,
      qualified: 0,
      sales: sales.length,
    };
  }

  private async getFinancialData(
    companyId: string,
    startDate: Date,
    endDate: Date,
    groupBy?: string
  ): Promise<any> {
    const sales = await prisma.sale.findMany({
      where: {
        companyId,
        dataOrigin: { not: 'DEMO' },
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'completed',
      },
      select: { amount: true, profit: true },
    });

    const spend = await prisma.metricSnapshot.aggregate({
      where: {
        campaign: { companyId },
        dataOrigin: { not: 'DEMO' },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { spend: true, impressions: true, clicks: true },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
    const totalSpend = Number(spend._sum.spend || 0);

    return {
      revenue: totalRevenue,
      profit: totalProfit,
      spend: totalSpend,
      impressions: Number(spend._sum.impressions || 0),
      clicks: Number(spend._sum.clicks || 0),
    };
  }

  private computeMetrics(funnel: any, financials: any): KPIMetrics {
    const { revenue, profit, spend, impressions, clicks } = financials;
    const { leads, sales } = funnel;

    return {
      impressions,
      clicks,
      leads,
      qualified: funnel.qualified,
      deals: 0,
      sales,
      customers: 0,
      clickThroughRate: impressions > 0 ? clicks / impressions : 0,
      costPerClick: clicks > 0 ? spend / clicks : 0,
      costPerLead: leads > 0 ? spend / leads : 0,
      conversionRate: leads > 0 ? sales / leads : 0,
      customerAcquisitionCost: sales > 0 ? spend / sales : 0,
      spend,
      revenue,
      grossProfit: revenue - spend,
      netProfit: profit,
      marginPercent: revenue > 0 ? ((revenue - spend) / revenue) * 100 : 0,
      roas: spend > 0 ? revenue / spend : 0,
      roi: spend > 0 ? ((profit / spend) * 100) : 0,
      ltv: 0,
      cltv: 0,
      averageTicket: sales > 0 ? revenue / sales : 0,
      averageOrderValue: 0,
    };
  }

  private async cacheKPISnapshot(
    companyId: string,
    metrics: KPIMetrics,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    await prisma.kPISnapshot.upsert({
      where: {
        companyId_period_date_channel_campaignId_productId: {
          companyId,
          period: 'day',
          date: new Date(),
          channel: null,
          campaignId: null,
          productId: null,
        },
      },
      update: {
        totalRevenue: new Decimal(metrics.revenue),
        totalProfit: new Decimal(metrics.netProfit),
        leads: metrics.leads,
        sales: metrics.sales,
        conversionRate: metrics.conversionRate,
        roas: metrics.roas,
        roi: metrics.roi,
      },
      create: {
        companyId,
        period: 'day',
        date: new Date(),
        totalRevenue: new Decimal(metrics.revenue),
        totalProfit: new Decimal(metrics.netProfit),
        leads: metrics.leads,
        sales: metrics.sales,
        conversionRate: metrics.conversionRate,
        roas: metrics.roas,
        roi: metrics.roi,
      },
    });
  }
}

export function getKPIService(): KPIService {
  return new KPIService();
}
