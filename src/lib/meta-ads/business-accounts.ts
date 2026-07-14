import { prisma } from "@/lib/prisma";

export interface MetaBusinessAccount {
  id: string;
  name: string;
  adAccounts: Array<{
    id: string;
    name: string;
    accountStatus: number;
  }>;
}

export async function fetchMetaBusinessAccounts(
  accessToken: string
): Promise<MetaBusinessAccount[]> {
  try {
    // Get business accounts
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/businesses?fields=id,name,owned_ad_accounts{id,name,account_status}&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error("Meta API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error("Failed to fetch Meta business accounts:", err);
    return [];
  }
}

export async function storeMetaBusinessAccount(
  userId: string,
  businessId: string,
  businessName: string,
  accessToken: string
) {
  return prisma.adAccount.upsert({
    where: {
      userId_channel_externalId: {
        userId,
        channel: "META",
        externalId: businessId,
      },
    },
    update: {
      name: businessName,
      accessToken,
      lastSyncedAt: new Date(),
    },
    create: {
      userId,
      channel: "META",
      externalId: businessId,
      name: businessName,
      accessToken,
      lastSyncedAt: new Date(),
    },
  });
}
