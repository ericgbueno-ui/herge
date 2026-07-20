export interface DailyCampaignMetric {
  externalCampaignId: string;
  campaignName: string;
  objective?: string;
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue?: number;
  raw?: Prisma.InputJsonValue;
}

export interface AdAccountRef {
  externalAccountId: string;
  name: string;
  loginCustomerId?: string;
}
import type { Prisma } from "@prisma/client";
