import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncTikTokAdAccount } from "@/lib/tiktok-ads/sync";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tiktokAccounts = await prisma.adAccount.findMany({
      where: {
        channel: "TIKTOK",
        accessToken: { not: null },
      },
      select: {
        id: true,
        name: true,
        externalAccountId: true,
        accessToken: true,
        companyId: true,
      },
    });

    console.log(`Syncing ${tiktokAccounts.length} TikTok Ads accounts...`);

    const results = [];

    for (const account of tiktokAccounts) {
      if (!account.accessToken) continue;
      try {
        const result = await syncTikTokAdAccount({
          id: account.id,
          externalAccountId: account.externalAccountId,
          accessToken: account.accessToken,
          companyId: account.companyId,
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
      message: `Synced ${results.filter((r) => r.ok).length}/${results.length} TikTok Ads accounts`,
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
