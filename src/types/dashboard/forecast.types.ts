export interface DashboardForecastItem {
  id: string;
  forecastDate: string;
  projectedRevenue: number;
  projectedSales: number;
  projectedProfit: number | null;
  confidence: number;
}

export interface DashboardForecastResponse {
  forecasts: DashboardForecastItem[];
}
