import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserMetaAccounts, storeMetaAccessToken } from "@/lib/meta-ads/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, discover accounts from Meta API
    const accessToken = process.env.META_ADS_ACCESS_TOKEN;
    let discoveredAccounts = [];

    if (accessToken) {
      try {
        const url = `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.data) {
          discoveredAccounts = data.data || [];
          // Sync discovered accounts to database
          for (const acc of discoveredAccounts) {
            await storeMetaAccessToken({
              accessToken,
              businessAccountId: acc.id,
              accountName: acc.name,
            });
          }
          console.log(`[meta/accounts] synced ${discoveredAccounts.length} discovered account(s)`);
        }
      } catch (err) {
        console.warn("[meta/accounts] failed to discover accounts from Meta API:", err);
      }
    }

    // Get all accounts from database (including discovered ones)
    const accounts = await getUserMetaAccounts();
    console.log(`[meta/accounts] returning ${accounts.length} account(s)`);

    return NextResponse.json({
      ok: true,
      accounts: accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        externalId: acc.externalAccountId,
        lastSyncedAt: acc.lastSyncedAt,
      })),
    });
  } catch (err) {
    console.error("Get Meta accounts error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
