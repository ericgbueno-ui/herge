import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(auth);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.adAccount.findMany({
      where: {
        userId: session.user.email,
        channel: "SHOPEE",
      },
    });

    return NextResponse.json({
      ok: true,
      accounts: accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        externalId: acc.externalId,
        lastSyncedAt: acc.lastSyncedAt,
      })),
    });
  } catch (err) {
    console.error("Get Shopee accounts error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
