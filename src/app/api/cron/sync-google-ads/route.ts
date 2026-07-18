import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncGoogleAdsAccount } from "@/lib/google-ads/sync";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const googleAccounts = await prisma.adAccount.findMany({
      where: {
        channel: "GOOGLE",
        refreshToken: { not: null },
      },
      select: {
        id: true,
        name: true,
        externalAccountId: true,
        refreshToken: true,
        companyId: true,
        loginCustomerId: true,
      },
    });

    console.log(`Syncing ${googleAccounts.length} Google Ads accounts...`);

    const results = [];

    for (const account of googleAccounts) {
      if (!account.refreshToken) continue;
      try {
        const result = await syncGoogleAdsAccount({
          id: account.id,
          externalAccountId: account.externalAccountId,
          refreshToken: account.refreshToken,
          companyId: account.companyId,
          loginCustomerId: account.loginCustomerId,
        });
        results.push({ account: account.name, ok: true, ...result });
      } catch (err) {
        results.push({
          account: account.name,
          ok: false,
          error: (err as Error).message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Synced ${results.filter((r) => r.ok).length}/${results.length} Google Ads accounts`,
      results,
    });
  } catch (err) {
    console.error("Cron sync error:", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
