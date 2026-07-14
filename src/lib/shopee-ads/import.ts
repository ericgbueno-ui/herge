import { prisma } from "@/lib/prisma";

interface ShopeeRow {
  campaign_name: string;
  campaign_id: string;
  spend: string;
  impressions: string;
  clicks: string;
  conversions: string;
  conversion_value: string;
}

export async function parseShopeeCSV(csv: string): Promise<ShopeeRow[]> {
  const lines = csv.split("\n").filter((line: any) => line.trim());
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const rows: ShopeeRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: any = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });

    if (row.campaign_name && row.campaign_id) {
      rows.push({
        campaign_name: row.campaign_name || "",
        campaign_id: row.campaign_id || "",
        spend: row.spend || "0",
        impressions: row.impressions || "0",
        clicks: row.clicks || "0",
        conversions: row.conversions || "0",
        conversion_value: row.conversion_value || "0",
      });
    }
  }

  return rows;
}

export async function importShopeeCSV(
  userId: string,
  accountId: string,
  csvData: ShopeeRow[]
) {
  try {
    let synced = 0;
    let errors = 0;

    for (const row of csvData) {
      try {
        const campaign = await prisma.campaign.upsert({
          where: { externalId: row.campaign_id },
          update: {
            name: row.campaign_name,
          },
          create: {
            externalId: row.campaign_id,
            name: row.campaign_name,
            status: "ACTIVE",
            adAccountId: accountId,
          },
        });

        await prisma.metricSnapshot.create({
          data: {
            campaignId: campaign.id,
            date: new Date(),
            spend: parseFloat(row.spend || "0"),
            impressions: parseInt(row.impressions || "0"),
            clicks: parseInt(row.clicks || "0"),
            conversions: parseInt(row.conversions || "0"),
            conversionValue: parseFloat(row.conversion_value || "0"),
          },
        });

        synced++;
      } catch (err) {
        console.error(`Error importing Shopee campaign ${row.campaign_id}:`, err);
        errors++;
      }
    }

    await prisma.adAccount.update({
      where: { externalId: accountId },
      data: { lastSyncedAt: new Date() },
    });

    return { synced, errors, total: csvData.length };
  } catch (err) {
    console.error("Failed to import Shopee CSV:", err);
    return { synced: 0, errors: csvData.length, total: csvData.length };
  }
}
