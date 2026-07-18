import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v21.0";

const ACCOUNTS = [
  { key: "CAMINHOS", id: "1501790135057764", name: "Caminhos do Sul Gramado", color: "#2563eb" },
  { key: "ARQUITETO", id: "369147520", name: "Arquiteto de Sonhos", color: "#10b981" },
  { key: "MULTITRIP", id: "1637758977778486", name: "Multi Trip | Ads Principal", color: "#f97316" },
];

function actionValue(actions: any[], type: string): number {
  if (!Array.isArray(actions)) return 0;
  const a = actions.find((x) => x.action_type === type);
  return a ? Number(a.value) || 0 : 0;
}

function base(acc: (typeof ACCOUNTS)[number]) {
  return {
    key: acc.key, id: acc.id, name: acc.name, color: acc.color,
    spend: 0, impressions: 0, reach: 0, clicks: 0, msgs: 0, leads: 0, sales: 0, revenue: 0, creatives: [] as any[],
  };
}

function classifyFormat(creative: any): "VID" | "IMG" | "CAR" | "COL" {
  const ot = creative?.object_type;
  const child = creative?.object_story_spec?.link_data?.child_attachments;
  const afs = creative?.asset_feed_spec;
  if (Array.isArray(child) && child.length > 1) return "CAR";
  if (ot === "VIDEO" || creative?.object_story_spec?.video_data || (afs?.videos && afs.videos.length)) return "VID";
  if (afs?.images && afs.images.length > 1) return "CAR";
  return "IMG";
}

async function fetchCreatives(token: string, id: string, datePreset: string) {
  try {
    const insFields = "ad_id,ad_name,spend,impressions,clicks,actions";
    const insUrl = `${GRAPH}/act_${id}/insights?level=ad&fields=${insFields}&date_preset=${datePreset}&limit=60&access_token=${encodeURIComponent(token)}`;
    const adFields = encodeURIComponent("id,name,creative{object_type,object_story_spec{link_data{child_attachments{name}},video_data{video_id}},asset_feed_spec{videos,images}}");
    const adsUrl = `${GRAPH}/act_${id}/ads?fields=${adFields}&limit=60&access_token=${encodeURIComponent(token)}`;
    const [insR, adsR] = await Promise.all([fetch(insUrl, { cache: "no-store" }), fetch(adsUrl, { cache: "no-store" })]);
    const ins = await insR.json();
    const ads = await adsR.json();
    const fmt: Record<string, { format: string; name: string }> = {};
    for (const a of ads?.data || []) fmt[a.id] = { format: classifyFormat(a.creative), name: a.name };
    return (ins?.data || [])
      .map((r: any) => {
        const msgs = actionValue(r.actions || [], "onsite_conversion.total_messaging_connection");
        const f = fmt[r.ad_id] || { format: "IMG", name: r.ad_name };
        return {
          format: f.format, copy: (r.ad_name || f.name || "Anuncio").slice(0, 44),
          spend: Number(r.spend) || 0, impressions: Number(r.impressions) || 0,
          clicks: Number(r.clicks) || 0, msgs, sales: 0, revenue: 0,
        };
      })
      .filter((x: any) => x.spend > 0)
      .sort((a: any, b: any) => b.spend - a.spend)
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchAccount(token: string, acc: (typeof ACCOUNTS)[number], datePreset: string) {
  const fields = "spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,action_values";
  const url = `${GRAPH}/act_${acc.id}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${encodeURIComponent(token)}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    const row = j?.data?.[0];
    if (!row) return { ...base(acc), status: r.ok ? "sem_dados" : "erro", error: j?.error?.message || null };
    const actions = row.actions || [];
    const values = row.action_values || [];
    const msgs = actionValue(actions, "onsite_conversion.total_messaging_connection");
    const leads = actionValue(actions, "onsite_conversion.messaging_first_reply") || actionValue(actions, "onsite_conversion.messaging_user_depth_2_message_send");
    const sales = actionValue(actions, "purchase") || actionValue(actions, "onsite_conversion.purchase") || actionValue(actions, "offsite_conversion.fb_pixel_purchase");
    const revenue = actionValue(values, "purchase") || actionValue(values, "omni_purchase") || actionValue(values, "offsite_conversion.fb_pixel_purchase");
    const creatives = Number(row.spend) > 0 ? await fetchCreatives(token, acc.id, datePreset) : [];
    return {
      key: acc.key, id: acc.id, name: acc.name, color: acc.color, status: "ok" as const,
      spend: Number(row.spend) || 0, impressions: Number(row.impressions) || 0, reach: Number(row.reach) || 0,
      clicks: Number(row.clicks) || 0, msgs, leads: leads || msgs, sales, revenue, creatives,
    };
  } catch (e: any) {
    return { ...base(acc), status: "erro" as const, error: e?.message || "falha" };
  }
}

async function manualSales(): Promise<Record<string, { sales: number; revenue: number }>> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const evs = await prisma.conversionEvent.findMany({
      where: { amount: { not: null }, createdAt: { gte: since } },
      select: { amount: true, metadata: true },
    });
    const by: Record<string, { sales: number; revenue: number }> = {};
    for (const e of evs) {
      const acc = (e.metadata as any)?.account;
      if (!acc) continue;
      by[acc] ??= { sales: 0, revenue: 0 };
      by[acc].sales += 1;
      by[acc].revenue += Number(e.amount || 0);
    }
    return by;
  } catch {
    return {};
  }
}

async function getToken(): Promise<string | null> {
  try {
    const acc = await prisma.adAccount.findFirst({
      where: { channel: AdChannel.META, accessToken: { not: null } },
      select: { accessToken: true },
      orderBy: { createdAt: "desc" },
    });
    if (acc?.accessToken) return acc.accessToken;
  } catch {}
  return process.env.META_ADS_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN || null;
}

async function applySales(accounts: any[], sales: Record<string, { sales: number; revenue: number }>) {
  for (const a of accounts) {
    const s = sales[a.id];
    if (s) {
      a.sales = (a.sales || 0) + s.sales;
      a.revenue = (a.revenue || 0) + s.revenue;
      if (a.status !== "ok") a.status = "ok";
    }
  }
  return accounts;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const datePreset = searchParams.get("date_preset") || "last_30d";
  const accountId = searchParams.get("accountId");

  if (accountId) {
    // Conta real conectada via Configuracoes: busca na mesma tabela que /projects usa,
    // nao na lista fixa abaixo (evita divergencia entre o que o usuario conectou e o que o painel mostra).
    const dbAccount = await prisma.adAccount.findFirst({
      where: { channel: AdChannel.META, externalAccountId: accountId },
      select: { externalAccountId: true, name: true, accessToken: true },
    });
    if (!dbAccount) {
      return NextResponse.json({ ok: false, error: "Conta nao encontrada entre as contas conectadas" }, { status: 404 });
    }
    const token = dbAccount.accessToken || (await getToken());
    if (!token) return NextResponse.json({ ok: false, error: "Token do Meta nao configurado (nem na conta nem no banco nem no env)" }, { status: 400 });

    // Remove "act_" prefix if present, since fetchAccount adds it
    const accountIdClean = dbAccount.externalAccountId.replace(/^act_/, "");
    const target = { key: dbAccount.externalAccountId, id: accountIdClean, name: dbAccount.name, color: "#2563eb" };
    const [account, sales] = await Promise.all([
      fetchAccount(token, target, datePreset),
      manualSales(),
    ]);
    const [withSales] = await applySales([account], sales);
    return NextResponse.json({ ok: true, datePreset, accounts: [withSales] });
  }

  const token = await getToken();
  if (!token) return NextResponse.json({ ok: false, error: "Token do Meta nao configurado (nem no banco nem no env)" }, { status: 400 });

  const [accounts, sales] = await Promise.all([
    Promise.all(ACCOUNTS.map((a) => fetchAccount(token, a, datePreset))),
    manualSales(),
  ]);

  return NextResponse.json({ ok: true, datePreset, accounts: await applySales(accounts, sales) });
}
