import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserTikTokAdsAccounts } from "@/lib/tiktok-ads/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await getUserTikTokAdsAccounts(session.user.email);

    return NextResponse.json({
      ok: true,
      accounts: accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        externalId: acc.externalId,
        lastSyncedAt: acc.lastSyncedAt,
      })),
    });
  } catch (err) {
    console.error("Get TikTok Ads accounts error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
