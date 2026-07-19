export interface DashboardAlertItem {
  id: string;
  campaignId: string | null;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ERROR' | 'DEBUG';
  type: string;
  message: string;
  threshold?: number | null;
  currentValue?: number | null;
  createdAt: string;
  dismissedAt?: string | null;
}

export interface DashboardAlertsResponse {
  alerts: DashboardAlertItem[];
  total: number;
}
