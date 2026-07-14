import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserGoogleAdsAccounts } from "@/lib/google-ads/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await getUserGoogleAdsAccounts(session.user.email);

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
    console.error("Get Google Ads accounts error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
