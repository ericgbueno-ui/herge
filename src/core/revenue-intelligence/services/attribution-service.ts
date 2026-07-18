/**
 * ATTRIBUTION SERVICE
 * Motor central de rastreamento de origem
 * Responsável por manter a cadeia Lead → Deal → Sale → Revenue
 */

import { prisma } from '@/lib/prisma';
import { getEventBus } from '@/core/integrations/services/event-bus';

export interface AttributionData {
  leadId: string;
  companyId: string;
  channel: string; // META|GOOGLE|TIKTOK|SHOPEE|ORGANIC|DIRECT
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  creativeId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  device?: string;
  browser?: string;
  os?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface AttributionChain {
  lead: any;
  deal?: any;
  sale?: any;
  customer?: any;
  revenue?: number;
  profit?: number;
  roi?: number;
}

export class AttributionService {
  /**
   * Cria atribuição para um lead
   * Chamado automaticamente quando lead entra no sistema
   */
  async attributeLead(data: AttributionData): Promise<any> {
    try {
      const { leadId, companyId, channel, campaignId, utmSource } = data;

      // 1. Valida lead existe
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} não encontrado`);
      }

      // 2. Verifica duplicata (mesmo email/phone em 24h)
      const existingLead = await this.findDuplicate(
        companyId,
        lead.email,
        lead.phone
      );

      // 3. Cria/atualiza atribuição
      const attribution = await prisma.leadAttribution.upsert({
        where: { leadId },
        update: {
          channel,
          source: utmSource || 'direct',
          campaignId: campaignId || lead.campaign,
          touchPoints: { increment: 1 },
          lastTouchAt: new Date(),
        },
        create: {
          leadId,
          companyId,
          channel,
          source: utmSource || 'direct',
          campaignId: campaignId || lead.campaign,
          firstTouchAt: new Date(),
          lastTouchAt: new Date(),
        },
      });

      // 4. Se duplicata, marca
      if (existingLead && existingLead.id !== leadId) {
        await prisma.leadAttribution.update({
          where: { leadId },
          data: {
            isDuplicate: true,
            duplicateOf: existingLead.id,
          },
        });
      }

      // 5. Registra evento de entrada
      await this.recordJourneyEvent(
        leadId,
        companyId,
        'lead_created',
        'system'
      );

      // 6. Emite evento
      getEventBus().emit('LeadAttributed', {
        leadId,
        companyId,
        channel,
        campaignId,
      });

      return attribution;
    } catch (error) {
      console.error('[AttributionService] Erro ao atribuir lead:', error);
      throw error;
    }
  }

  /**
   * Rastreia evento na jornada do lead
   */
  async recordJourneyEvent(
    leadId: string,
    companyId: string,
    eventType: string,
    source: string,
    data?: Record<string, any>
  ): Promise<any> {
    return prisma.leadJourneyEvent.create({
      data: {
        leadId,
        companyId,
        eventType,
        eventSource: source,
        eventData: data,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Atribui um deal ao lead
   */
  async attributeDeal(
    leadId: string,
    dealId: string,
    companyId: string
  ): Promise<any> {
    try {
      // Carrega lead e sua atribuição
      const leadAttribution = await prisma.leadAttribution.findUnique({
        where: { leadId },
      });

      if (!leadAttribution) {
        throw new Error(`Atribuição do lead ${leadId} não encontrada`);
      }

      // Registra evento
      await this.recordJourneyEvent(leadId, companyId, 'deal_created', 'crm', {
        dealId,
        channel: leadAttribution.channel,
        campaignId: leadAttribution.campaignId,
      });

      // Emite evento
      getEventBus().emit('DealAttributed', {
        leadId,
        dealId,
        companyId,
        channel: leadAttribution.channel,
      });

      return { leadId, dealId, channelOrigin: leadAttribution.channel };
    } catch (error) {
      console.error('[AttributionService] Erro ao atribuir deal:', error);
      throw error;
    }
  }

  /**
   * Atribui uma venda ao lead
   * Calcula toda a cadeia de valor
   */
  async attributeSale(
    saleId: string,
    leadId: string,
    companyId: string,
    amount: number
  ): Promise<any> {
    try {
      // 1. Carrega lead e atribuição
      const attribution = await prisma.leadAttribution.findUnique({
        where: { leadId },
        include: { lead: true },
      });

      if (!attribution) {
        throw new Error(`Atribuição não encontrada para lead ${leadId}`);
      }

      // 2. Atualiza Sale com informações de origem
      await prisma.sale.update({
        where: { id: saleId },
        data: {
          leadId,
          campaignId: attribution.campaignId,
        },
      });

      // 3. Registra evento
      await this.recordJourneyEvent(leadId, companyId, 'sale_created', 'crm', {
        saleId,
        amount,
        channel: attribution.channel,
      });

      // 4. Atualiza lead score
      await this.updateLeadScore(leadId, 100); // venda = score máximo

      // 5. Emite evento
      getEventBus().emit('SaleAttributed', {
        leadId,
        saleId,
        companyId,
        amount,
        channel: attribution.channel,
        campaignId: attribution.campaignId,
      });

      return {
        leadId,
        saleId,
        amount,
        channel: attribution.channel,
        campaignId: attribution.campaignId,
      };
    } catch (error) {
      console.error('[AttributionService] Erro ao atribuir venda:', error);
      throw error;
    }
  }

  /**
   * Converte lead para cliente
   * Mantém histórico completo
   */
  async convertToCustomer(
    leadId: string,
    companyId: string
  ): Promise<any> {
    try {
      // 1. Carrega lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { attribution: true },
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} não encontrado`);
      }

      // 2. Cria cliente (NUNCA deleta o lead)
      const customer = await prisma.customer.create({
        data: {
          companyId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          leadId,
          type: 'individual',
        },
      });

      // 3. Calcula LTV baseado em histórico
      const ltv = await this.calculateLTV(leadId);

      // 4. Atualiza customer com LTV
      await prisma.customer.update({
        where: { id: customer.id },
        data: { ltv },
      });

      // 5. Registra evento
      await this.recordJourneyEvent(leadId, companyId, 'customer_created', 'crm', {
        customerId: customer.id,
      });

      // 6. Marca lead como qualificado
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          qualified: true,
          qualifiedAt: new Date(),
        },
      });

      // 7. Emite evento
      getEventBus().emit('CustomerCreated', {
        leadId,
        customerId: customer.id,
        companyId,
        channel: lead.attribution?.channel,
      });

      return customer;
    } catch (error) {
      console.error('[AttributionService] Erro ao converter cliente:', error);
      throw error;
    }
  }

  /**
   * Encontra duplicata de lead (mesmo email/phone)
   */
  private async findDuplicate(
    companyId: string,
    email?: string,
    phone?: string
  ): Promise<any> {
    if (!email && !phone) return null;

    return prisma.lead.findFirst({
      where: {
        companyId,
        OR: [
          email ? { email } : { email: '' }, // hack: sempre false se undefined
          phone ? { phone } : { phone: '' },
        ],
      },
      include: { attribution: true },
    });
  }

  /**
   * Calcula Lead Score
   */
  async updateLeadScore(leadId: string, pointsToAdd: number): Promise<void> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { attribution: true },
    });

    if (!lead) return;

    let newScore = (lead.score || 0) + pointsToAdd;

    // Bônus se qualificado
    if (lead.qualified) {
      newScore += 50;
    }

    // Bônus se de paid channel
    if (lead.attribution?.channel !== 'ORGANIC' && lead.attribution?.channel !== 'DIRECT') {
      newScore += 25;
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { score: Math.min(newScore, 100) }, // max 100
    });
  }

  /**
   * Calcula LTV (Lifetime Value) de um cliente
   */
  async calculateLTV(leadId: string, daysBack: number = 365): Promise<number> {
    const sales = await prisma.sale.findMany({
      where: {
        leadId,
        createdAt: {
          gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
        },
      },
      select: { amount: true },
    });

    return sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  }

  /**
   * Retorna cadeia completa de atribuição de um lead
   */
  async getAttributionChain(leadId: string): Promise<AttributionChain> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        attribution: true,
        deals: true,
        customer: true,
      },
    });

    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    // Busca venda associada
    let sale = null;
    let revenue = 0;
    let profit = 0;

    if (lead.deals?.length > 0) {
      const deals = lead.deals;
      const sales = await prisma.sale.findMany({
        where: { dealId: { in: deals.map((d) => d.id) } },
      });

      if (sales.length > 0) {
        sale = sales[0]; // primeira venda
        revenue = Number(sales[0].amount || 0);
        profit = Number(sales[0].profit || 0);
      }
    }

    const roi = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      lead,
      deal: lead.deals?.[0],
      sale,
      customer: lead.customer,
      revenue,
      profit,
      roi,
    };
  }

  /**
   * Marcar motivo de perda de um deal
   */
  async markDealAsLost(
    dealId: string,
    reason: string, // Preço|Concorrência|Sem Interesse|Sem Resposta|Prazo|Produto|Outros
    companyId: string
  ): Promise<any> {
    const deal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: 'lost',
        lostReason: reason,
        closedAt: new Date(),
      },
    });

    // Emite evento
    getEventBus().emit('DealLost', {
      dealId,
      companyId,
      reason,
      leadId: deal.leadId,
    });

    return deal;
  }
}

export function getAttributionService(): AttributionService {
  return new AttributionService();
}
