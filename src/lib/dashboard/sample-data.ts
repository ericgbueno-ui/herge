// Dados de demonstração para as 5 visões do painel.
// Estrutura pronta para ser substituída por dados reais (Meta/Google/TikTok/Shopee).

export type CreativeFormat = "VID" | "IMG" | "CAR" | "COL";

export interface Creative {
  format: CreativeFormat;
  copy: string;       // ex.: "COPY A", "TEXTO 1"
  spend: number;      // gasto R$
  impressions: number;
  clicks: number;
  msgs: number;       // conversas iniciadas no WhatsApp
  sales: number;
  revenue: number;
}

export interface ChannelData {
  key: "META" | "GOOGLE" | "TIKTOK" | "SHOPEE";
  name: string;
  color: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  msgs: number;       // conversas WhatsApp
  leads: number;      // negociação
  sales: number;
  revenue: number;
  creatives: Creative[];
}

export const FORMAT_LABEL: Record<CreativeFormat, string> = {
  VID: "Vídeo",
  IMG: "Imagem",
  CAR: "Carrossel",
  COL: "Coleção",
};

export const CHANNELS: ChannelData[] = [
  {
    key: "META", name: "Meta Ads", color: "#2563eb",
    spend: 8750.85, impressions: 526000, reach: 284500, clicks: 12840, msgs: 1264, leads: 412, sales: 48, revenue: 28560,
    creatives: [
      { format: "VID", copy: "GRAMADO - TOUR", spend: 3200, impressions: 210000, clicks: 5600, msgs: 520, sales: 18, revenue: 11240 },
      { format: "IMG", copy: "TRANSFER POA", spend: 2400, impressions: 156000, clicks: 3840, msgs: 312, sales: 14, revenue: 8680 },
      { format: "CAR", copy: "HOTÉIS 5 ESTRELAS", spend: 1850, impressions: 98000, clicks: 2100, msgs: 280, sales: 11, revenue: 6480 },
      { format: "VID", copy: "EXPERIÊNCIA SNOWLAND", spend: 1300, impressions: 62000, clicks: 1300, msgs: 152, sales: 5, revenue: 2160 },
    ],
  },
  {
    key: "GOOGLE", name: "Google Ads", color: "#10b981",
    spend: 4290.50, impressions: 184000, reach: 125800, clicks: 6240, msgs: 284, leads: 168, sales: 22, revenue: 12840,
    creatives: [
      { format: "VID", copy: "YT - GRAMADO TURISMO", spend: 1650, impressions: 68000, clicks: 2200, msgs: 112, sales: 9, revenue: 5280 },
      { format: "IMG", copy: "SEARCH - HOTÉIS", spend: 1580, impressions: 62000, clicks: 2180, msgs: 98, sales: 8, revenue: 4680 },
      { format: "CAR", copy: "PMAX - PACOTES", spend: 1060, impressions: 54000, clicks: 1860, msgs: 74, sales: 5, revenue: 2880 },
    ],
  },
  {
    key: "TIKTOK", name: "TikTok Ads", color: "#0ea5e9",
    spend: 2180.40, impressions: 342000, reach: 215600, clicks: 8940, msgs: 156, leads: 92, sales: 16, revenue: 7480,
    creatives: [
      { format: "VID", copy: "UGC VIAGEM", spend: 1300, impressions: 215000, clicks: 5800, msgs: 98, sales: 11, revenue: 5120 },
      { format: "VID", copy: "TREND DESCOBERTA", spend: 880, impressions: 127000, clicks: 3140, msgs: 58, sales: 5, revenue: 2360 },
    ],
  },
  {
    key: "SHOPEE", name: "Shopee Ads", color: "#f97316",
    spend: 1580.25, impressions: 412000, reach: 268900, clicks: 9280, msgs: 0, leads: 0, sales: 42, revenue: 8960,
    creatives: [
      { format: "IMG", copy: "VOUCHER HOSPEDAGEM", spend: 890, impressions: 256000, clicks: 5600, msgs: 0, sales: 28, revenue: 5960 },
      { format: "IMG", copy: "PACOTE COMPLETO", spend: 690, impressions: 156000, clicks: 3680, msgs: 0, sales: 14, revenue: 3000 },
    ],
  },
];

// Métricas derivadas (Impressões, Alcance, CTR, CPC, CPM, CPA)
export function metrics(c: { spend: number; impressions: number; reach: number; clicks: number; sales: number; revenue: number }) {
  const ctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0;
  const cpc = c.clicks ? c.spend / c.clicks : 0;
  const cpm = c.impressions ? (c.spend / c.impressions) * 1000 : 0;
  const cpa = c.sales ? c.spend / c.sales : 0;
  const roas = c.spend ? c.revenue / c.spend : 0;
  return { ctr, cpc, cpm, cpa, roas };
}

export function creativeMetrics(cr: Creative) {
  const ctr = cr.impressions ? (cr.clicks / cr.impressions) * 100 : 0;
  const cpc = cr.clicks ? cr.spend / cr.clicks : 0;
  const cpa = cr.sales ? cr.spend / cr.sales : 0;
  const roas = cr.spend ? cr.revenue / cr.spend : 0;
  return { ctr, cpc, cpa, roas };
}
