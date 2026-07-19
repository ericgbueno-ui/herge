export interface DashboardGoalSummary {
  id: string;
  name: string;
  description: string | null;
  metricType: string;
  targetValue: number;
  currentValue: number;
  progressPercent: number;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

export interface DashboardGoalsResponse {
  goals: DashboardGoalSummary[];
  inProgress: number;
  achieved: number;
  missed: number;
  updatedAt: string;
}
