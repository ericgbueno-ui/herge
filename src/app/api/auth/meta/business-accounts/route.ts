import { NextRequest, NextResponse } from "next/server";
import { fetchMetaBusinessAccounts } from "@/lib/meta-ads/business-accounts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 400 }
      );
    }

    const businessAccounts = await fetchMetaBusinessAccounts(accessToken);

    return NextResponse.json({
      ok: true,
      businessAccounts,
    });
  } catch (err) {
    console.error("Meta business accounts error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
