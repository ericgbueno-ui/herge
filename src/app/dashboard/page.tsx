"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { KPICard } from "@/components/KPICard";
import {
  CHANNELS as DEMO,
  FORMAT_LABEL,
  metrics,
  creativeMetrics,
} from "@/lib/dashboard/sample-data";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const nf = new Intl.NumberFormat("pt-BR");
const pct = (v: number) => `${v.toFixed(2)}%`;

type Acct = {
  key: string; id?: string; name: string; color: string;
  spend: number; impressions: number; reach: number; clicks: number;
  msgs: number; leads: number; sales: number; revenue: number;
  creatives: any[]; status?: string;
};

function Card({ title, right, children }: any) {
  return (
    <section className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(79,70,229,0.10)] transition hover:ring-indigo-200/70">
      {title && (
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          {right}
        </div>
      )}
      <div className="px-6 pb-6 pt-1">{children}</div>
    </section>
  );
}

function Kpi({ label, value, hint, accent = "text-slate-900" }: any) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-5 ring-1 ring-slate-200/70 shadow-[0_8px_24px_-16px_rgba(79,70,229,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(79,70,229,0.30)]">
      <div className="text-[12px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tracking-tight tabular-nums ${accent}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

function Funnel({ msgs, leads, sales }: { msgs: number; leads: number; sales: number }) {
  const steps = [
    { label: "Conversas no WhatsApp", value: msgs, color: "#bfdbfe", ink: "#1e40af" },
    { label: "Avancaram a conversa", value: leads, color: "#60a5fa", ink: "#0b2f6b" },
    { label: "Vendas fechadas", value: sales, color: "#2563eb", ink: "#ffffff" },
  ];
  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      {steps.map((s, i) => (
        <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ width: `${100 - i * 24}%`, background: s.color, color: s.ink }}>
          <div className="text-[12px] font-medium opacity-90">{s.label}</div>
          <div className="text-sm font-bold tabular-nums">{msgs ? pct((s.value / msgs) * 100) : "0%"} ({nf.format(s.value)})</div>
        </div>
      ))}
    </div>
  );
}

function ChannelView({ c, onMarkSale }: { c: Acct; onMarkSale: () => void }) {
  const m = metrics(c);
  const th = "px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400";
  const td = "px-3 py-3 text-right tabular-nums text-slate-700";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{c.name}</h2>
        {c.id && (
          <button onClick={onMarkSale} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-500 hover:to-teal-400">
            + Marcar venda
          </button>
        )}
      </div>
      {c.status && c.status !== "ok" && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-100">Sem dados no periodo para esta conta (sem campanha ativa ou billing pendente).</div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Impressoes" value={nf.format(c.impressions)} hint="vezes exibido" />
        <Kpi label="Alcance" value={nf.format(c.reach)} hint="pessoas unicas" />
        <Kpi label="CTR" value={pct(m.ctr)} hint="cliques / impressoes" />
        <Kpi label="CPC" value={c.clicks ? brl.format(m.cpc) : "—"} hint="custo por clique" />
        <Kpi label="CPM" value={c.impressions ? brl.format(m.cpm) : "—"} hint="por 1.000 impr." />
        <Kpi label="CPA" value={c.sales ? brl.format(m.cpa) : "—"} hint="custo por venda" accent="text-blue-700" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Gasto" value={brl.format(c.spend)} />
        <Kpi label="Faturamento" value={c.revenue ? brl.format(c.revenue) : "—"} accent="text-emerald-600" hint={c.revenue ? "" : "marque as vendas"} />
        <Kpi label="ROAS" value={c.revenue ? `${m.roas.toFixed(2)}x` : "—"} accent={c.revenue ? (m.roas >= 1 ? "text-emerald-600" : "text-rose-500") : "text-slate-400"} hint="retorno sobre gasto" />
        <Kpi label="Conversas WhatsApp" value={nf.format(c.msgs)} accent="text-blue-700" hint={c.msgs ? `${brl.format(c.spend / c.msgs)} por conversa` : ""} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card title="Desempenho por Criativo e Formato">
          {c.creatives && c.creatives.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Formato</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Copy</th>
                    <th className={th}>Gasto</th><th className={th}>Impr.</th><th className={th}>CTR</th><th className={th}>Conversas</th><th className={th}>Vendas</th><th className={th}>ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {c.creatives.map((cr: any, i: number) => {
                    const cm = creativeMetrics(cr);
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-3 py-3"><span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{cr.format}</span><span className="ml-2 text-[11px] text-slate-400">{FORMAT_LABEL[cr.format as keyof typeof FORMAT_LABEL]}</span></td>
                        <td className="px-3 py-3 font-medium text-slate-700">{cr.copy}</td>
                        <td className={td}>{brl.format(cr.spend)}</td>
                        <td className={td}>{nf.format(cr.impressions)}</td>
                        <td className={td}>{pct(cm.ctr)}</td>
                        <td className={`${td} font-semibold text-blue-700`}>{nf.format(cr.msgs)}</td>
                        <td className={td}>{nf.format(cr.sales)}</td>
                        <td className={`${td} font-semibold ${cm.roas >= 1 ? "text-emerald-600" : "text-rose-500"}`}>{cr.spend ? `${cm.roas.toFixed(2)}x` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-400">Quebra por criativo (VID / IMG / CAR / COL) sera exibida quando ativarmos o detalhamento por anuncio.</div>
          )}
        </Card>
        <Card title="Funil da Jornada (WhatsApp)"><Funnel msgs={c.msgs} leads={c.leads} sales={c.sales} /></Card>
      </div>
    </div>
  );
}

function demoFor(channel: string): Acct {
  const found = (DEMO as unknown as Acct[]).find((c) => c.key === channel);
  return found ?? (DEMO[0] as unknown as Acct);
}

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ctx, setCtx] = useState<{ channel: string; accountId: string } | null>(null);
  const [account, setAccount] = useState<Acct | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  // modal marcar venda
  const [saleFor, setSaleFor] = useState<Acct | null>(null);
  const [amount, setAmount] = useState("");
  const [vehicleType, setVehicleType] = useState<"spin" | "sedan">("spin");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function load(channel: string, accountId: string) {
    setLoading(true);
    if (channel !== "META") {
      // Integracao ao vivo por conta ainda existe so para Meta Ads.
      setAccount(demoFor(channel));
      setLive(false);
      setLoading(false);
      return;
    }
    fetch(`/api/meta/overview?accountId=${encodeURIComponent(accountId)}`)
      .then((r) => r.json())
      .then((j) => {
        // Normalize accountId: remove "act_" prefix for comparison
        const accountIdNormalized = accountId.replace(/^act_/, "");
        const found = j?.ok && Array.isArray(j.accounts) ? j.accounts.find((a: Acct) => a.id === accountIdNormalized) : null;
        if (found) {
          setAccount(found);
          setLive(true);
        } else {
          setAccount(demoFor(channel));
          setLive(false);
        }
      })
      .catch(() => {
        setAccount(demoFor(channel));
        setLive(false);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const channel = typeof window !== "undefined" ? localStorage.getItem("selectedChannel") : null;
    const accountId = typeof window !== "undefined" ? localStorage.getItem("selectedAccount") : null;
    if (!channel || !accountId) { router.push("/projects"); return; }
    setCtx({ channel, accountId });
    setReady(true);
    load(channel, accountId);
  }, [router]);

  async function submitSale(e: React.FormEvent) {
    e.preventDefault();
    if (!saleFor || !ctx) return;
    const value = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (!value || value <= 0) { setErr("Informe um valor valido."); return; }
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: saleFor.id, accountName: saleFor.name, channel: "META", amount: value, vehicleType }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Falha ao salvar");
      setSaleFor(null); setAmount(""); setVehicleType("spin");
      load(ctx.channel, ctx.accountId);
    } catch (e: any) {
      setErr(e?.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !account) return <div className="flex min-h-[60vh] items-center justify-center text-slate-400">Carregando...</div>;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(ctx ? `/projects?channel=${ctx.channel}` : "/projects")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 shadow-sm transition hover:ring-indigo-300 hover:text-indigo-600"
          >
            ← Voltar
          </button>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-lg font-extrabold text-transparent">Painel de Controle</h1>
            <p className="text-xs text-slate-400">Inicio / {account.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${live ? "bg-emerald-50 text-emerald-600 ring-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.35)]" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>
            <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} /> {live ? "Dados ao vivo" : loading ? "Carregando..." : "Demonstracao"}
          </span>
          <div className="flex -space-x-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white ring-2 ring-white">TO</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-slate-400 to-slate-300 text-xs font-semibold text-white ring-2 ring-white">EB</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/80 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm">Ultimos 30 dias</span>
          <div className="ml-auto">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition">Baixar Relatorio</button>
          </div>
        </div>

        <ChannelView c={account} onMarkSale={() => { setErr(""); setSaleFor(account); }} />

        <p className="mt-6 text-center text-[11px] text-slate-300">{live ? "Dados reais do Meta Ads (ultimos 30 dias) + vendas marcadas manualmente." : "Dados de demonstracao - conecte a conta para exibir numeros reais."}</p>
      </main>

      {saleFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setSaleFor(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitSale} className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-xl p-6 shadow-[0_30px_80px_-20px_rgba(79,70,229,0.35)] ring-1 ring-white/60">
            <h3 className="text-lg font-bold text-slate-900">Marcar venda</h3>
            <p className="mt-0.5 text-sm text-slate-500">{saleFor.name}</p>
            <label className="mt-5 block text-sm font-medium text-slate-600">Valor da venda (R$)</label>
            <input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
            <label className="mt-4 block text-sm font-medium text-slate-600">Tipo de veículo</label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setVehicleType("spin")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${vehicleType === "spin" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                🚐 Spin
              </button>
              <button
                type="button"
                onClick={() => setVehicleType("sedan")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${vehicleType === "sedan" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                🚗 Sedan
              </button>
            </div>
            {err && <p className="mt-3 text-sm font-medium text-rose-600">{err}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setSaleFor(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-60">{saving ? "Salvando..." : "Registrar venda"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
