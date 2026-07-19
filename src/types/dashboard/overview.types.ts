export interface DashboardMetricItem {
  value: number;
  delta: number;
}

export interface DashboardKPIItem {
  value: number;
  delta: number;
}

export interface DashboardSeriesPoint {
  date: string;
  receita: number;
  investimento: number;
}

export interface DashboardChannelShare {
  name: string;
  channel: string;
  value: number;
}

export interface DashboardCampaignOverview {
  id: string;
  name: string;
  channel: string;
  invest: number;
  leads: number;
  sales: number;
  revenue: number;
  roas: number;
  cpa: number;
}

export interface DashboardCompanyOverview {
  name: string;
  segment: string;
  revenue: number;
  delta: number;
}

export interface DashboardFunnelStage {
  label: string;
  value: number;
}

export interface DashboardActivityItem {
  type: string;
  title: string;
  detail: string;
  at: string;
}

export interface DashboardOverviewResponse {
  ok: true;
  hasData: boolean;
  metrics: {
    cpc: DashboardMetricItem;
    ctr: DashboardMetricItem;
    cpm: DashboardMetricItem;
    ticket: DashboardMetricItem;
  };
  kpis: {
    investment: DashboardKPIItem;
    revenue: DashboardKPIItem;
    roas: DashboardKPIItem;
    leads: DashboardKPIItem;
    sales: DashboardKPIItem;
    conversionRate: DashboardKPIItem;
  };
  series: DashboardSeriesPoint[];
  channels: DashboardChannelShare[];
  campaigns: DashboardCampaignOverview[];
  companies: DashboardCompanyOverview[];
  funnel: DashboardFunnelStage[];
  activities: DashboardActivityItem[];
}
