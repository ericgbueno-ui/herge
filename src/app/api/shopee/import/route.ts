import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseShopeeCSV, importShopeeCSV } from "@/lib/shopee-ads/import";
import { z } from "zod";

const ImportSchema = z.object({
  csvContent: z.string().min(1, "CSV content required"),
  accountId: z.string().min(1, "Account ID required"),
  accountName: z.string().min(1, "Account name required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { csvContent, accountId, accountName } = ImportSchema.parse(body);

    // Create or update Shopee account
    const account = await prisma.adAccount.upsert({
      where: {
        userId_channel_externalId: {
          userId: session.user.email,
          channel: "SHOPEE",
          externalId: accountId,
        },
      },
      update: {
        name: accountName,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: session.user.email,
        channel: "SHOPEE",
        externalId: accountId,
        name: accountName,
        lastSyncedAt: new Date(),
      },
    });

    // Parse and import CSV
    const rows = await parseShopeeCSV(csvContent);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid data found in CSV" },
        { status: 400 }
      );
    }

    const result = await importShopeeCSV(session.user.email, account.externalId, rows);

    return NextResponse.json({
      ok: true,
      message: `Importados ${result.synced} campanhas do Shopee`,
      result,
      account: {
        id: account.id,
        name: account.name,
        externalId: account.externalId,
      },
    });
  } catch (err) {
    console.error("Shopee import error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
