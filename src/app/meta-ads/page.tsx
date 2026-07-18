"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MetricData {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
}

interface Campaign {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  roas: number;
  conversionValue: number;
}

interface DailyInsight {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const number = new Intl.NumberFormat("pt-BR");

export default function MetaAdsPage() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetaData();
  }, []);

  async function fetchMetaData() {
    try {
      setLoading(true);
      const response = await fetch("/api/meta/insights");
      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "Erro ao carregar dados do Meta Ads");
        return;
      }

      setMetrics(data.metrics);
      setCampaigns(data.campaigns);
      setDailyInsights(data.dailyInsights);
    } catch (err) {
      setError("Erro ao conectar com Meta Ads API");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 text-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-slate-400">Carregando dados do Meta Ads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 text-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            ❌ {error}
          </div>
          <div className="mt-4 p-4 bg-white/80 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Configure as variáveis de ambiente:</p>
            <code className="text-xs text-slate-500 block">
              META_ADS_ACCESS_TOKEN=seu_token<br />
              META_ADS_ACCOUNT_ID=act_123456789
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50 text-slate-900 p-6">
      <div className="aurora-blob pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-400/25 to-indigo-300/25 blur-3xl" />
      <div className="relative max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-2xl font-extrabold text-transparent hover:opacity-80 transition">
            Hergé
          </Link>
          <div className="flex gap-3">
            <Link href="/dashboard" className="px-4 py-2 text-sm bg-white ring-1 ring-slate-200 hover:ring-indigo-300 rounded-xl shadow-sm transition text-slate-600">
              ← Voltar uma seção
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-indigo-600 self-center">
              Canais
            </Link>
          </div>
        </div>

        {/* Meta Ads Title */}
        <div>
          <h1 className="text-3xl font-bold mb-1 text-slate-900">📘 Meta Ads</h1>
          <p className="text-slate-500">Últimos 30 dias</p>
        </div>

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] p-4">
              <p className="text-sm text-slate-500 mb-1">💰 Gasto Total</p>
              <p className="text-2xl font-bold text-slate-900">{currency.format(metrics.spend)}</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] p-4">
              <p className="text-sm text-slate-500 mb-1">👁️ Impressões</p>
              <p className="text-2xl font-bold text-slate-900">{number.format(Math.round(metrics.impressions))}</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] p-4">
              <p className="text-sm text-slate-500 mb-1">🖱️ Cliques</p>
              <p className="text-2xl font-bold text-slate-900">{number.format(Math.round(metrics.clicks))}</p>
              <p className="text-xs text-slate-400 mt-1">CTR: {metrics.ctr.toFixed(2)}%</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] p-4">
              <p className="text-sm text-slate-500 mb-1">💵 CPC Médio</p>
              <p className="text-2xl font-bold text-slate-900">{currency.format(metrics.cpc)}</p>
            </div>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.15)]">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">🎯 Campanhas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="px-6 py-3 font-normal">Campanha</th>
                  <th className="px-6 py-3 font-normal text-right">Gasto</th>
                  <th className="px-6 py-3 font-normal text-right">Impressões</th>
                  <th className="px-6 py-3 font-normal text-right">Cliques</th>
                  <th className="px-6 py-3 font-normal text-right">CTR</th>
                  <th className="px-6 py-3 font-normal text-right">CPC</th>
                  <th className="px-6 py-3 font-normal text-right">Conversões</th>
                  <th className="px-6 py-3 font-normal text-right">CPA</th>
                  <th className="px-6 py-3 font-normal text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-slate-400">
                      Nenhuma campanha encontrada
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-6 py-3 text-slate-700">{campaign.name}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{currency.format(campaign.spend)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{number.format(Math.round(campaign.impressions))}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{number.format(Math.round(campaign.clicks))}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{campaign.ctr.toFixed(2)}%</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{currency.format(campaign.cpc)}</td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-emerald-600">{campaign.conversions}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{currency.format(campaign.cpa)}</td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-blue-600">{campaign.roas.toFixed(2)}x</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Insights */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.15)]">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">📅 Histórico Diário</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="px-6 py-3 font-normal">Data</th>
                  <th className="px-6 py-3 font-normal text-right">Gasto</th>
                  <th className="px-6 py-3 font-normal text-right">Impressões</th>
                  <th className="px-6 py-3 font-normal text-right">Cliques</th>
                  <th className="px-6 py-3 font-normal text-right">Alcance</th>
                </tr>
              </thead>
              <tbody>
                {dailyInsights.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-slate-400">
                      Nenhum dado disponível
                    </td>
                  </tr>
                ) : (
                  dailyInsights.map((insight) => (
                    <tr key={insight.date} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-6 py-3 text-slate-700">{new Date(insight.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{currency.format(insight.spend)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{number.format(insight.impressions)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">{number.format(insight.clicks)}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-400">{number.format(insight.reach)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchMetaData}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all"
          >
            🔄 Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
}
