export interface DashboardInsightTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
}

export interface DashboardInsightAnomaly {
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
}

export interface DashboardInsightCampaign {
  rank: number;
  campaignId: string;
  revenue: number;
}

export interface DashboardInsightAttendant {
  rank: number;
  attendantId: string | null;
  attendantName: string;
  revenue: number;
}

export interface DashboardInsightsResponse {
  trends: DashboardInsightTrend[];
  anomalies: DashboardInsightAnomaly[];
  topCampaigns: DashboardInsightCampaign[];
  topAttendants: DashboardInsightAttendant[];
  score: number;
  generatedAt: string;
}
