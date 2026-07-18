// Mock Database - Simula BD sem necessidade de conexão real
// Usado para desenvolvimento/teste quando o banco não está disponível

import { CHANNELS } from "./dashboard/sample-data";

export const mockCompanies = [
  {
    id: "caminhos-gramado",
    name: "Caminhos do Sul Gramado",
    segment: "Turismo",
    responsibleName: "Roberto Silva",
    phone: "(54) 99999-0001",
    city: "Gramado",
    state: "RS",
    website: "www.caminhosdsul.com.br",
    instagram: "@caminhosdosulgramado",
    facebook: "Caminhos do Sul",
  },
  {
    id: "multi-trip",
    name: "Multi Trip Viagens",
    segment: "Turismo",
    responsibleName: "Juliana Costa",
    phone: "(51) 98888-0002",
    city: "Porto Alegre",
    state: "RS",
    website: "www.multitrip.com.br",
    instagram: "@multitrip",
    facebook: "MultiTrip",
  },
  {
    id: "colchoes-brasil",
    name: "Colchões Brasil Premium",
    segment: "Mobiliário",
    responsibleName: "Marcos Ferreira",
    phone: "(11) 97777-0003",
    city: "São Paulo",
    state: "SP",
    website: "www.colchoesbrasilpremium.com.br",
    instagram: "@colchoesbrasilpremium",
  },
];

export const mockAdAccounts = [
  {
    id: "meta-1",
    channel: "META",
    name: "Meta Ads - Caminhos do Sul",
    externalAccountId: "1501790135057764",
    companyId: "caminhos-gramado",
  },
  {
    id: "google-1",
    channel: "GOOGLE",
    name: "Google Ads - Caminhos do Sul",
    externalAccountId: "7481234567",
    companyId: "caminhos-gramado",
  },
  {
    id: "tiktok-1",
    channel: "TIKTOK",
    name: "TikTok Ads - Caminhos do Sul",
    externalAccountId: "1234567890123456",
    companyId: "caminhos-gramado",
  },
  {
    id: "shopee-1",
    channel: "SHOPEE",
    name: "Shopee Ads - Caminhos do Sul",
    externalAccountId: "987654321",
    companyId: "caminhos-gramado",
  },
];

export const mockCampaigns = [
  {
    id: "camp-1",
    name: "Transfer POA - Gramado",
    adAccountId: "meta-1",
    objective: "CONVERSIONS",
    companyId: "caminhos-gramado",
  },
  {
    id: "camp-2",
    name: "City Tour Gramado",
    adAccountId: "meta-1",
    objective: "CONVERSIONS",
    companyId: "caminhos-gramado",
  },
  {
    id: "camp-3",
    name: "Busca - Hotéis Gramado",
    adAccountId: "google-1",
    objective: "CONVERSIONS",
    companyId: "caminhos-gramado",
  },
  {
    id: "camp-4",
    name: "Descoberta - Turismo Gramado",
    adAccountId: "tiktok-1",
    objective: "CONVERSIONS",
    companyId: "caminhos-gramado",
  },
  {
    id: "camp-5",
    name: "Voucher Hospedagem",
    adAccountId: "shopee-1",
    objective: "CONVERSIONS",
    companyId: "caminhos-gramado",
  },
];

export const mockMetrics = CHANNELS.flatMap((channel) =>
  channel.creatives.map((creative) => ({
    campaignId: `camp-${CHANNELS.indexOf(channel) + 1}`,
    channel: channel.key,
    spend: creative.spend,
    impressions: creative.impressions,
    clicks: creative.clicks,
    conversions: creative.sales,
    conversionValue: creative.revenue,
  }))
);

export const mockDashboardData = {
  hasData: true,
  kpis: {
    investment: { value: 16801, delta: 18.6 },
    revenue: { value: 57840, delta: 32.4 },
    roas: { value: 3.44, delta: 22.1 },
    leads: { value: 672, delta: 15.7 },
    sales: { value: 128, delta: 19.4 },
    conversionRate: { value: 19.0, delta: 6.3 },
  },
  metrics: {
    cpc: { value: 1.32, delta: -6.4 },
    ctr: { value: 2.38, delta: 8.1 },
    cpm: { value: 18.75, delta: -4.2 },
    ticket: { value: 452.5, delta: 14.3 },
  },
  series: [
    { date: "18/06", receita: 82000, investimento: 21000 },
    { date: "22/06", receita: 96000, investimento: 24500 },
    { date: "26/06", receita: 88000, investimento: 23000 },
    { date: "30/06", receita: 112000, investimento: 27500 },
    { date: "04/07", receita: 104000, investimento: 26000 },
    { date: "08/07", receita: 132000, investimento: 30500 },
    { date: "12/07", receita: 158000, investimento: 33000 },
    { date: "16/07", receita: 189000, investimento: 36500 },
  ],
  channels: [
    { name: "Meta Ads", channel: "META", value: 52 },
    { name: "Google Ads", channel: "GOOGLE", value: 25 },
    { name: "TikTok Ads", channel: "TIKTOK", value: 13 },
    { name: "Shopee Ads", channel: "SHOPEE", value: 10 },
  ],
  companies: [
    { name: "Caminhos do Sul", segment: "Turismo", revenue: 28560, delta: 28.4 },
    { name: "Multi Trip", segment: "Turismo", revenue: 18750, delta: 19.7 },
    { name: "Colchões Brasil", segment: "Mobiliário", revenue: 9960, delta: 13.2 },
  ],
  campaigns: [
    {
      name: "Transfer POA - Gramado",
      channel: "META",
      invest: 2150,
      leads: 128,
      sales: 48,
      revenue: 38400,
      roas: 7.92,
      cpa: 37.89,
    },
    {
      name: "Busca - Hotéis Gramado",
      channel: "GOOGLE",
      invest: 1620,
      leads: 86,
      sales: 26,
      revenue: 21840,
      roas: 6.74,
      cpa: 37.67,
    },
    {
      name: "Descoberta - Turismo",
      channel: "TIKTOK",
      invest: 1340,
      leads: 112,
      sales: 15,
      revenue: 12750,
      roas: 4.76,
      cpa: 23.92,
    },
    {
      name: "Voucher Hospedagem",
      channel: "SHOPEE",
      invest: 975,
      leads: 64,
      sales: 22,
      revenue: 17160,
      roas: 8.8,
      cpa: 30.47,
    },
  ],
  funnel: [
    { label: "Leads", value: 672 },
    { label: "Orçamentos", value: 412 },
    { label: "Negociação", value: 287 },
    { label: "Vendas", value: 128 },
    { label: "Pós Venda", value: 74 },
  ],
  activities: [
    {
      type: "conversation",
      title: "Nova conversa iniciada",
      detail: "Caminhos do Sul Gramado",
      at: new Date().toISOString(),
    },
    {
      type: "sale",
      title: "Venda concluída",
      detail: "Multi Trip Viagens",
      at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      type: "lead",
      title: "Novo lead recebido",
      detail: "Colchões Brasil",
      at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
  ],
};
