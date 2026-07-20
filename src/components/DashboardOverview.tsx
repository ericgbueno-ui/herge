"use client";

/* eslint-disable react-hooks/set-state-in-effect -- estados refletem filtros externos, localStorage e ciclo da requisição */

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  CircleDollarSign,
  Clock3,
  Eye,
  MousePointerClick,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

type Company = { id: string; name: string; segment: string };
type Campaign = {
  id: string;
  name: string;
  objective: string | null;
  accountName: string;
  companyName: string;
  channel: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  platformConversions: number;
  costPerPlatformResult: number | null;
  sales: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
  profitKnown: boolean;
  netProfit: number | null;
};
type Data = {
  companies: Company[];
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    sales: number;
    unattributedSales: number;
    unattributedRevenue: number;
    revenue: number;
    roas: number | null;
    profitKnown: boolean;
    netProfit: number | null;
    lastSyncAt: string | null;
  };
  channels: Array<{ channel: string; spend: number; impressions: number; clicks: number; ctr: number }>;
  campaignPerformance: Campaign[];
};

type ManualSale = { id: string; amount: number; profit: number | null; productName: string | null; completedAt: string | null; createdAt: string; notes: string | null; dataOrigin: string; campaign: { id: string; name: string } | null };

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (value: number) => value.toLocaleString("pt-BR");
const dec = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const channelLabel: Record<string, string> = { META: "Meta Ads", GOOGLE: "Google Ads", TIKTOK: "TikTok Ads", SHOPEE: "Shopee Ads" };

function campaignDecision(campaign: Campaign, targetRoas: number, maxResultCost: number) {
  if (campaign.spend <= 0) return { label: "SEM VEICULAÇÃO", tone: "text-slate-400", badge: "bg-slate-500/10 border-slate-400/20", reason: "Sem investimento no período." };

  if (campaign.sales > 0) {
    if (!targetRoas) return { label: "DEFINIR ROAS ALVO", tone: "text-blue-300", badge: "bg-blue-500/10 border-blue-400/20", reason: "Há venda confirmada, mas falta a meta financeira." };
    if (campaign.profitKnown && campaign.netProfit !== null && campaign.netProfit < 0) return { label: "PAUSAR E CORRIGIR", tone: "text-red-300", badge: "bg-red-500/10 border-red-400/20", reason: `Prejuízo após mídia de ${brl(Math.abs(campaign.netProfit))}.` };
    if (campaign.roas !== null && campaign.roas >= targetRoas * 1.5 && campaign.sales >= 3) return { label: "DUPLICAR TESTE", tone: "text-fuchsia-300", badge: "bg-fuchsia-500/10 border-fuchsia-400/20", reason: `ROAS ${dec(campaign.roas)}x com ${campaign.sales} vendas.` };
    if (campaign.roas !== null && campaign.roas >= targetRoas && campaign.sales >= 2) return { label: "AUMENTAR 20%", tone: "text-emerald-300", badge: "bg-emerald-500/10 border-emerald-400/20", reason: `ROAS acima da meta com recorrência.` };
    if (campaign.roas !== null && campaign.roas >= targetRoas) return { label: "MANTER", tone: "text-cyan-300", badge: "bg-cyan-500/10 border-cyan-400/20", reason: "Meta financeira atingida; aguardar mais volume." };
    return { label: "REDUZIR E OTIMIZAR", tone: "text-orange-300", badge: "bg-orange-500/10 border-orange-400/20", reason: `ROAS abaixo da meta de ${dec(targetRoas)}x.` };
  }

  if (campaign.platformConversions > 0) {
    if (!maxResultCost) return { label: "DEFINIR CUSTO-ALVO", tone: "text-blue-300", badge: "bg-blue-500/10 border-blue-400/20", reason: `${campaign.platformConversions} resultados de mídia; falta o custo máximo aceitável.` };
    const cost = campaign.costPerPlatformResult || 0;
    if (cost <= maxResultCost * 0.7 && campaign.platformConversions >= 10) return { label: "TESTAR AUMENTO", tone: "text-emerald-300", badge: "bg-emerald-500/10 border-emerald-400/20", reason: `${campaign.platformConversions} resultados a ${brl(cost)} cada.` };
    if (cost <= maxResultCost) return { label: "MANTER", tone: "text-cyan-300", badge: "bg-cyan-500/10 border-cyan-400/20", reason: `Custo por resultado dentro da meta: ${brl(cost)}.` };
    return { label: "OTIMIZAR", tone: "text-orange-300", badge: "bg-orange-500/10 border-orange-400/20", reason: `Custo por resultado ${brl(cost)}, acima da meta.` };
  }

  if (maxResultCost && campaign.spend >= maxResultCost * 2) return { label: "PAUSAR E REVISAR", tone: "text-red-300", badge: "bg-red-500/10 border-red-400/20", reason: `${brl(campaign.spend)} gastos sem resultado da plataforma.` };
  return { label: "AGUARDAR DADOS", tone: "text-amber-300", badge: "bg-amber-500/10 border-amber-400/20", reason: "Sem volume suficiente para uma decisão segura." };
}

function Kpi({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Target }) {
  return <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span><Icon className="h-4 w-4 text-cyan-300" /></div><p className="mt-4 text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

export function DashboardOverview({ initialCompanyId = "" }: { initialCompanyId?: string }) {
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [days, setDays] = useState(30);
  const [targetRoas, setTargetRoas] = useState("");
  const [maxResultCost, setMaxResultCost] = useState("");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [recentSales, setRecentSales] = useState<ManualSale[]>([]);
  const [saleForm, setSaleForm] = useState({ campaignId: "", amount: "", profit: "", productName: "", saleDate: new Date().toISOString().slice(0, 10), notes: "" });

  useEffect(() => { setCompanyId(initialCompanyId); }, [initialCompanyId]);
  useEffect(() => {
    const saved = window.localStorage.getItem(`hergel-targets:${companyId || "portfolio"}`);
    if (!saved) { setTargetRoas(""); setMaxResultCost(""); return; }
    try { const parsed = JSON.parse(saved); setTargetRoas(parsed.targetRoas || ""); setMaxResultCost(parsed.maxResultCost || parsed.maxCpa || ""); } catch { setTargetRoas(""); setMaxResultCost(""); }
  }, [companyId]);
  useEffect(() => { window.localStorage.setItem(`hergel-targets:${companyId || "portfolio"}`, JSON.stringify({ targetRoas, maxResultCost })); }, [companyId, targetRoas, maxResultCost]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    const query = new URLSearchParams({ days: String(days) });
    if (companyId) query.set("companyId", companyId);
    fetch(`/api/dashboard/control-center?${query}`, { signal: controller.signal })
      .then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error || "Falha ao carregar dados"); setData(json); })
      .catch((requestError) => { if (requestError.name !== "AbortError") setError(requestError.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [companyId, days, refreshKey]);

  const targetRoasNumber = Number(targetRoas) || 0;
  const maxResultCostNumber = Number(maxResultCost) || 0;
  const campaigns = useMemo(() => (data?.campaignPerformance || [])
    .filter((item) => !channel || item.channel === channel)
    .filter((item) => !search || `${item.name} ${item.companyName} ${item.accountName}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
    .map((item) => ({ ...item, decision: campaignDecision(item, targetRoasNumber, maxResultCostNumber) })), [data, channel, search, targetRoasNumber, maxResultCostNumber]);
  const selected = data?.companies.find((company) => company.id === companyId);

  function changeCompany(value: string) {
    setCompanyId(value);
    window.history.replaceState(null, "", value ? `/dashboard?companyId=${encodeURIComponent(value)}` : "/dashboard");
  }

  async function loadSales() {
    if (!companyId) return;
    const response = await fetch(`/api/dashboard/sales?companyId=${encodeURIComponent(companyId)}`);
    const json = await response.json();
    if (response.ok) setRecentSales(json.sales || []);
  }

  async function openSaleForm() {
    if (!companyId) return;
    setSaleError("");
    setShowSaleForm(true);
    await loadSales();
  }

  async function saveSale(event: React.FormEvent) {
    event.preventDefault();
    if (!companyId) return;
    setSavingSale(true); setSaleError("");
    const response = await fetch("/api/dashboard/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...saleForm, companyId, campaignId: saleForm.campaignId === "unattributed" ? null : saleForm.campaignId }) });
    const json = await response.json();
    if (!response.ok) { setSaleError(json.error || "Não foi possível registrar a venda"); setSavingSale(false); return; }
    setSaleForm({ campaignId: "", amount: "", profit: "", productName: "", saleDate: new Date().toISOString().slice(0, 10), notes: "" });
    setSavingSale(false); setRefreshKey((value) => value + 1); await loadSales();
  }

  async function deleteSale(saleId: string) {
    const response = await fetch(`/api/dashboard/sales?saleId=${encodeURIComponent(saleId)}`, { method: "DELETE" });
    if (!response.ok) { const json = await response.json(); setSaleError(json.error || "Não foi possível excluir a venda"); return; }
    setRefreshKey((value) => value + 1); await loadSales();
  }

  return <main className="space-y-6 px-6 py-6 lg:px-8">
    <section className="flex flex-col gap-5 border-b border-white/8 pb-6 xl:flex-row xl:items-end xl:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Hergel · Central de campanhas</p><h1 className="mt-2 text-3xl font-semibold text-white">{selected?.name || "Todas as contas"}</h1><p className="mt-2 text-sm text-slate-400">Desempenho real, resultado da plataforma, venda confirmada e decisão em um só lugar.</p><button type="button" onClick={openSaleForm} disabled={!companyId} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"><Plus className="h-4 w-4" />{companyId ? "Registrar venda" : "Selecione um cliente para registrar venda"}</button></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-400">Cliente<select value={companyId} onChange={(event) => changeCompany(event.target.value)} className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value="">Todos os clientes</option>{data?.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="text-xs text-slate-400">Período<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white"><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option></select></label>
        <label className="text-xs text-slate-400">ROAS financeiro alvo<input type="number" min="0" step="0.1" value={targetRoas} onChange={(event) => setTargetRoas(event.target.value)} placeholder="Ex.: 3" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
        <label className="text-xs text-slate-400">Custo máximo por resultado<input type="number" min="0" step="1" value={maxResultCost} onChange={(event) => setMaxResultCost(event.target.value)} placeholder="Ex.: 20" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white" /></label>
      </div>
    </section>

    {loading && <div className="flex items-center gap-2 rounded-xl border border-white/8 p-4 text-sm text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" />Atualizando dados reais…</div>}
    {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300"><AlertTriangle className="h-4 w-4" />{error}</div>}

    {data && <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi label="Investimento" value={brl(data.summary.spend)} detail={`${num(data.summary.impressions)} impressões`} icon={CircleDollarSign} />
        <Kpi label="Cliques" value={num(data.summary.clicks)} detail={`CTR ${dec(data.summary.ctr)}%`} icon={MousePointerClick} />
        <Kpi label="CPC médio" value={data.summary.clicks ? brl(data.summary.spend / data.summary.clicks) : "—"} detail="Investimento ÷ cliques" icon={Target} />
        <Kpi label="Vendas confirmadas" value={num(data.summary.sales)} detail={brl(data.summary.revenue)} icon={ShoppingCart} />
        <Kpi label="ROAS financeiro" value={data.summary.roas === null ? "—" : `${dec(data.summary.roas)}x`} detail="Receita confirmada ÷ mídia" icon={TrendingUp} />
        <Kpi label="Lucro após mídia" value={data.summary.netProfit === null ? "—" : brl(data.summary.netProfit)} detail={data.summary.profitKnown ? "Lucro informado menos mídia" : "Aguardando lucro das vendas"} icon={CircleDollarSign} />
      </section>

      {data.summary.unattributedSales > 0 && <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-amber-200"><strong>{data.summary.unattributedSales} venda(s) sem campanha vinculada</strong> · {brl(data.summary.unattributedRevenue)} entram no total financeiro, mas não alteram a decisão de nenhuma campanha.</div>}

      <section className="rounded-2xl border border-white/8 bg-white/[0.03]">
        <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div><h2 className="font-semibold text-white">Campanhas</h2><p className="mt-1 text-xs text-slate-500">Somente dados sincronizados. Resultado da plataforma não é tratado como venda.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar campanha" className="w-full rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600" /></label>
            <select value={channel} onChange={(event) => setChannel(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Todos os canais</option>{Object.entries(channelLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1650px] text-left text-sm">
          <thead className="bg-white/[0.025] text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Campanha / conta</th><th className="px-3 py-3">Canal</th><th className="px-3 py-3">Objetivo</th><th className="px-3 py-3">Investimento</th><th className="px-3 py-3">Impressões</th><th className="px-3 py-3">Cliques</th><th className="px-3 py-3">CTR</th><th className="px-3 py-3">CPC</th><th className="px-3 py-3">Resultados mídia</th><th className="px-3 py-3">Custo/resultado</th><th className="px-3 py-3">Vendas</th><th className="px-3 py-3">Receita</th><th className="px-3 py-3">CPA venda</th><th className="px-3 py-3">ROAS</th><th className="px-3 py-3">Lucro</th><th className="px-5 py-3">Decisão</th></tr></thead>
          <tbody className="divide-y divide-white/6">{campaigns.map((campaign) => <tr key={campaign.id} className="align-top text-slate-300 hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="max-w-72 font-medium text-white">{campaign.name}</p><p className="mt-1 text-xs text-slate-500">{campaign.companyName} · {campaign.accountName}</p></td><td className="px-3 py-4">{channelLabel[campaign.channel] || campaign.channel}</td><td className="px-3 py-4 text-slate-400">{campaign.objective || "Não informado"}</td><td className="px-3 py-4 font-medium text-white">{brl(campaign.spend)}</td><td className="px-3 py-4">{num(campaign.impressions)}</td><td className="px-3 py-4">{num(campaign.clicks)}</td><td className="px-3 py-4">{dec(campaign.ctr)}%</td><td className="px-3 py-4">{campaign.cpc === null ? "—" : brl(campaign.cpc)}</td><td className="px-3 py-4 font-medium text-cyan-200">{num(campaign.platformConversions)}</td><td className="px-3 py-4">{campaign.costPerPlatformResult === null ? "—" : brl(campaign.costPerPlatformResult)}</td><td className="px-3 py-4 font-semibold text-white">{campaign.sales}</td><td className="px-3 py-4">{brl(campaign.revenue)}</td><td className="px-3 py-4">{campaign.cpa === null ? "—" : brl(campaign.cpa)}</td><td className="px-3 py-4">{campaign.roas === null ? "—" : `${dec(campaign.roas)}x`}</td><td className="px-3 py-4">{campaign.netProfit === null ? "—" : brl(campaign.netProfit)}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${campaign.decision.badge} ${campaign.decision.tone}`}>{campaign.decision.label}</span><p className="mt-2 max-w-56 text-xs leading-5 text-slate-500">{campaign.decision.reason}</p></td></tr>)}{campaigns.length === 0 && <tr><td colSpan={16} className="px-5 py-12 text-center text-slate-500">Nenhuma campanha real encontrada para estes filtros.</td></tr>}</tbody>
        </table></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["META", "GOOGLE", "TIKTOK", "SHOPEE"].map((item) => { const values = data.channels.find((entry) => entry.channel === item); return <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><div className="flex items-center justify-between"><h3 className="font-semibold text-white">{channelLabel[item]}</h3><span className={`h-2.5 w-2.5 rounded-full ${values ? "bg-emerald-400" : "bg-slate-700"}`} /></div>{values ? <div className="mt-4 space-y-1 text-sm text-slate-400"><p className="text-xl font-semibold text-white">{brl(values.spend)}</p><p>{num(values.clicks)} cliques · CTR {dec(values.ctr)}%</p></div> : <p className="mt-4 text-sm text-slate-500">Sem dados sincronizados.</p>}</div>; })}</section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/8 pt-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Última sincronização: {data.summary.lastSyncAt ? new Date(data.summary.lastSyncAt).toLocaleString("pt-BR") : "não registrada"}</span><span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Período analisado: {days} dias</span><span className="flex items-center gap-1.5"><ArrowDownUp className="h-3.5 w-3.5" />Ordenação: maior investimento</span></div>
    </>}

    {showSaleForm && <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:p-8"><div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#090d1d] shadow-2xl"><div className="flex items-start justify-between border-b border-white/8 px-6 py-5"><div><h2 className="text-xl font-semibold text-white">Registrar venda confirmada</h2><p className="mt-1 text-sm text-slate-400">{selected?.name} · vincule à campanha para calcular CPA, ROAS e lucro.</p></div><button type="button" onClick={() => setShowSaleForm(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button></div><div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]"><form onSubmit={saveSale} className="space-y-4"><label className="block text-xs text-slate-400">Campanha que gerou a venda<select required value={saleForm.campaignId} onChange={(event) => setSaleForm({ ...saleForm, campaignId: event.target.value })} className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"><option value="">Selecione a campanha</option>{data?.campaignPerformance.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}<option value="unattributed">Não foi possível identificar a campanha</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-slate-400">Valor total recebido<input required type="number" min="0.01" step="0.01" value={saleForm.amount} onChange={(event) => setSaleForm({ ...saleForm, amount: event.target.value })} placeholder="Ex.: 850,00" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white" /></label><label className="text-xs text-slate-400">Lucro antes dos anúncios<input required type="number" min="0" step="0.01" value={saleForm.profit} onChange={(event) => setSaleForm({ ...saleForm, profit: event.target.value })} placeholder="Receita menos custos do serviço" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-slate-400">Produto ou serviço<input value={saleForm.productName} onChange={(event) => setSaleForm({ ...saleForm, productName: event.target.value })} placeholder="Ex.: Transfer ida e volta" className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white" /></label><label className="text-xs text-slate-400">Data da venda<input required type="date" value={saleForm.saleDate} onChange={(event) => setSaleForm({ ...saleForm, saleDate: event.target.value })} className="mt-1 block w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white" /></label></div><label className="block text-xs text-slate-400">Observação<textarea value={saleForm.notes} onChange={(event) => setSaleForm({ ...saleForm, notes: event.target.value })} rows={3} placeholder="Informação opcional para conferência" className="mt-1 block w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white" /></label>{saleError && <p className="rounded-xl border border-red-500/20 bg-red-500/8 p-3 text-sm text-red-300">{saleError}</p>}<button disabled={savingSale} className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{savingSale ? "Registrando…" : "Confirmar venda"}</button><p className="text-xs leading-5 text-slate-500">Lucro antes dos anúncios = valor recebido menos custo do produto, comissão, veículo, fornecedor ou operação. O Hergel desconta o investimento em mídia depois.</p></form><div><h3 className="text-sm font-semibold text-white">Vendas registradas</h3><div className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto">{recentSales.map((sale) => <div key={sale.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{brl(sale.amount)}</p><p className="mt-1 text-xs text-slate-400">{sale.campaign?.name || "Sem campanha"}</p><p className="mt-1 text-xs text-slate-600">{new Date(sale.completedAt || sale.createdAt).toLocaleDateString("pt-BR")} · lucro informado {sale.profit === null ? "—" : brl(sale.profit)}</p></div><button type="button" onClick={() => deleteSale(sale.id)} title="Excluir venda" className="rounded-lg p-2 text-slate-600 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div></div>)}{recentSales.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">Nenhuma venda manual registrada.</p>}</div></div></div></div></div>}
  </main>;
}
