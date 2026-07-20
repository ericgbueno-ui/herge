"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleDollarSign, MousePointerClick, RefreshCw, ShoppingCart, Target, TrendingUp, Users } from "lucide-react";

type Company = { id: string; name: string; segment: string };
type Campaign = { id: string; name: string; companyName: string; channel: string; spend: number; impressions: number; clicks: number; ctr: number; cpc: number | null; platformConversions: number; platformConversionValue: number; sales: number; revenue: number; roas: number | null; cpa: number | null; profitKnown: boolean; netProfit: number | null };
type Data = {
  companies: Company[];
  summary: { spend: number; impressions: number; clicks: number; ctr: number; leads: number; conversations: number; sales: number; revenue: number; roas: number | null; profitKnown: boolean; netProfit: number | null };
  channels: Array<{ channel: string; spend: number; impressions: number; clicks: number; ctr: number }>;
  campaignPerformance: Campaign[];
};

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (value: number) => value.toLocaleString("pt-BR");
const dec = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const channelLabel: Record<string, string> = { META: "Meta Ads", GOOGLE: "Google Ads", TIKTOK: "TikTok Ads", SHOPEE: "Shopee Ads" };

function decision(campaign: Campaign, targetRoas: number, maxCpa: number) {
  if (campaign.spend <= 0) return { label: "SEM VEICULAÇÃO", tone: "text-slate-400", reason: "Sem investimento no período" };
  if (campaign.sales === 0) return { label: "REVISAR ATRIBUIÇÃO", tone: "text-amber-300", reason: `${brl(campaign.spend)} gastos sem venda confirmada` };
  if (!targetRoas && !maxCpa) return { label: "DEFINIR META", tone: "text-blue-300", reason: "Informe ROAS alvo ou CPA máximo" };
  if (campaign.profitKnown && campaign.netProfit !== null && campaign.netProfit < 0) return { label: "PAUSAR / CORRIGIR", tone: "text-red-300", reason: `Prejuízo líquido de ${brl(Math.abs(campaign.netProfit))}` };
  const beatsRoas = targetRoas > 0 && campaign.roas !== null && campaign.roas >= targetRoas;
  const beatsCpa = maxCpa > 0 && campaign.cpa !== null && campaign.cpa <= maxCpa;
  const strongRoas = targetRoas > 0 && campaign.roas !== null && campaign.roas >= targetRoas * 1.5;
  const strongCpa = maxCpa > 0 && campaign.cpa !== null && campaign.cpa <= maxCpa * 0.7;
  if (campaign.sales >= 3 && (strongRoas || strongCpa) && (!campaign.profitKnown || (campaign.netProfit || 0) > 0)) return { label: "DUPLICAR TESTE", tone: "text-fuchsia-300", reason: "Resultado forte com pelo menos 3 vendas" };
  if (campaign.sales >= 2 && (beatsRoas || beatsCpa) && (!campaign.profitKnown || (campaign.netProfit || 0) > 0)) return { label: "AUMENTAR 20%", tone: "text-emerald-300", reason: "Meta atingida com recorrência" };
  if (beatsRoas || beatsCpa) return { label: "MANTER", tone: "text-cyan-300", reason: "Meta atingida; falta mais volume para escalar" };
  return { label: "REDUZIR / OTIMIZAR", tone: "text-orange-300", reason: "Resultado abaixo da meta informada" };
}

function Card({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Target }) {
  return <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span><Icon className="h-4 w-4 text-cyan-300" /></div><p className="mt-4 text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

export function DashboardOverview() {
  const [companyId, setCompanyId] = useState("");
  const [days, setDays] = useState(30);
  const [targetRoas, setTargetRoas] = useState("");
  const [maxCpa, setMaxCpa] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = `hergel-targets:${companyId || "portfolio"}`;
    const saved = window.localStorage.getItem(key);
    if (saved) { const parsed = JSON.parse(saved); setTargetRoas(parsed.targetRoas || ""); setMaxCpa(parsed.maxCpa || ""); } else { setTargetRoas(""); setMaxCpa(""); }
  }, [companyId]);
  useEffect(() => { window.localStorage.setItem(`hergel-targets:${companyId || "portfolio"}`, JSON.stringify({ targetRoas, maxCpa })); }, [companyId, targetRoas, maxCpa]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const query = new URLSearchParams({ days: String(days) }); if (companyId) query.set("companyId", companyId);
    fetch(`/api/dashboard/control-center?${query}`, { signal: controller.signal }).then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error || "Falha ao carregar dados"); setData(json); }).catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [companyId, days]);

  const targetRoasNumber = Number(targetRoas) || 0;
  const maxCpaNumber = Number(maxCpa) || 0;
  const campaigns = useMemo(() => (data?.campaignPerformance || []).map((campaign) => ({ ...campaign, decision: decision(campaign, targetRoasNumber, maxCpaNumber) })), [data, targetRoasNumber, maxCpaNumber]);
  const selected = data?.companies.find((company) => company.id === companyId);

  return <main className="space-y-6 px-6 py-6 lg:px-8">
    <section className="flex flex-col gap-5 border-b border-white/8 pb-6 2xl:flex-row 2xl:items-end 2xl:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Hergel · Gestão de tráfego</p><h1 className="mt-2 text-3xl font-semibold text-white">{selected?.name || "Decisões de mídia de todos os clientes"}</h1><p className="mt-2 text-sm text-slate-400">Meta, Google, TikTok e Shopee: investimento, venda, lucro e decisão por campanha.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-xs text-slate-400">Conta<select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Todas</option>{data?.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="text-xs text-slate-400">Período<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option></select></label><label className="text-xs text-slate-400">ROAS alvo<input type="number" min="0" step="0.1" value={targetRoas} onChange={(event) => setTargetRoas(event.target.value)} placeholder="Ex: 3" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label><label className="text-xs text-slate-400">CPA máximo<input type="number" min="0" step="1" value={maxCpa} onChange={(event) => setMaxCpa(event.target.value)} placeholder="Ex: 80" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label></div></section>

    {loading && <div className="flex items-center gap-2 rounded-xl border border-white/8 p-4 text-sm text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" /> Atualizando campanhas…</div>}
    {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300"><AlertTriangle className="h-4 w-4" />{error}</div>}

    {data && <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card label="Investimento" value={brl(data.summary.spend)} detail={`${num(data.summary.impressions)} impressões`} icon={CircleDollarSign} /><Card label="Cliques" value={num(data.summary.clicks)} detail={`CTR ${dec(data.summary.ctr)}%`} icon={MousePointerClick} /><Card label="Vendas confirmadas" value={num(data.summary.sales)} detail={brl(data.summary.revenue)} icon={ShoppingCart} /><Card label="Lucro após mídia" value={data.summary.netProfit === null ? "—" : brl(data.summary.netProfit)} detail={data.summary.profitKnown ? "Lucro das vendas menos anúncios" : "Preencha o lucro das vendas"} icon={TrendingUp} /><Card label="ROAS financeiro" value={data.summary.roas === null ? "—" : `${dec(data.summary.roas)}x`} detail="Receita confirmada ÷ investimento" icon={Target} /><Card label="Leads" value={num(data.summary.leads)} detail={`${data.summary.conversations} conversas`} icon={Users} /></section>

    {!targetRoasNumber && !maxCpaNumber && <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-4 text-sm text-blue-200">Informe o ROAS alvo ou CPA máximo da conta para liberar recomendações de manter, aumentar e duplicar. Sem meta, o sistema não inventa uma decisão.</div>}

    <section className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"><div className="border-b border-white/8 px-5 py-4"><h2 className="font-semibold text-white">Decisão por campanha</h2><p className="mt-1 text-xs text-slate-500">Venda e lucro são dados financeiros confirmados; conversão da plataforma aparece separada.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="bg-white/[0.025] text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Campanha</th><th className="px-3 py-3">Canal</th><th className="px-3 py-3">Gasto</th><th className="px-3 py-3">CTR</th><th className="px-3 py-3">CPC</th><th className="px-3 py-3">Conv. mídia</th><th className="px-3 py-3">Vendas</th><th className="px-3 py-3">Receita</th><th className="px-3 py-3">CPA</th><th className="px-3 py-3">ROAS</th><th className="px-3 py-3">Lucro</th><th className="px-5 py-3">Decisão</th></tr></thead><tbody className="divide-y divide-white/6">{campaigns.map((campaign) => <tr key={campaign.id} className="text-slate-300"><td className="px-5 py-4"><p className="max-w-64 font-medium text-white">{campaign.name}</p><p className="mt-1 text-xs text-slate-600">{campaign.companyName}</p></td><td className="px-3 py-4">{channelLabel[campaign.channel] || campaign.channel}</td><td className="px-3 py-4">{brl(campaign.spend)}</td><td className="px-3 py-4">{dec(campaign.ctr)}%</td><td className="px-3 py-4">{campaign.cpc === null ? "—" : brl(campaign.cpc)}</td><td className="px-3 py-4">{campaign.platformConversions}</td><td className="px-3 py-4 font-semibold text-white">{campaign.sales}</td><td className="px-3 py-4">{brl(campaign.revenue)}</td><td className="px-3 py-4">{campaign.cpa === null ? "—" : brl(campaign.cpa)}</td><td className="px-3 py-4">{campaign.roas === null ? "—" : `${dec(campaign.roas)}x`}</td><td className="px-3 py-4">{campaign.netProfit === null ? "—" : brl(campaign.netProfit)}</td><td className="px-5 py-4"><p className={`font-semibold ${campaign.decision.tone}`}>{campaign.decision.label}</p><p className="mt-1 max-w-52 text-xs text-slate-500">{campaign.decision.reason}</p></td></tr>)}{campaigns.length === 0 && <tr><td colSpan={12} className="px-5 py-12 text-center text-slate-500">Nenhuma campanha com dados reais neste período.</td></tr>}</tbody></table></div></section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["META", "GOOGLE", "TIKTOK", "SHOPEE"].map((channel) => { const values = data.channels.find((item) => item.channel === channel); return <div key={channel} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><div className="flex items-center justify-between"><h3 className="font-semibold text-white">{channelLabel[channel]}</h3><span className={`h-2.5 w-2.5 rounded-full ${values ? "bg-emerald-400" : "bg-slate-700"}`} /></div>{values ? <div className="mt-4 space-y-1 text-sm text-slate-400"><p className="text-xl font-semibold text-white">{brl(values.spend)}</p><p>{num(values.clicks)} cliques · CTR {dec(values.ctr)}%</p></div> : <p className="mt-4 text-sm text-slate-500">Sem dados sincronizados.</p>}</div>; })}</section></>}
  </main>;
}
