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
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-neutral-400">Carregando dados do Meta Ads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg border border-red-800 bg-red-950 p-4 text-red-100">
            ❌ {error}
          </div>
          <div className="mt-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-sm text-neutral-300 mb-2">Configure as variáveis de ambiente:</p>
            <code className="text-xs text-neutral-400 block">
              META_ADS_ACCESS_TOKEN=seu_token<br />
              META_ADS_ACCOUNT_ID=act_123456789
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">📘 Meta Ads</h1>
            <p className="text-neutral-400">Últimos 30 dias</p>
          </div>
          <Link href="/projects" className="text-sm text-neutral-400 hover:text-neutral-200">
            ← Voltar
          </Link>
        </div>

        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400 mb-1">💰 Gasto Total</p>
              <p className="text-2xl font-bold">{currency.format(metrics.spend)}</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400 mb-1">👁️ Impressões</p>
              <p className="text-2xl font-bold">{number.format(Math.round(metrics.impressions))}</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400 mb-1">🖱️ Cliques</p>
              <p className="text-2xl font-bold">{number.format(Math.round(metrics.clicks))}</p>
              <p className="text-xs text-neutral-500 mt-1">CTR: {metrics.ctr.toFixed(2)}%</p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400 mb-1">💵 CPC Médio</p>
              <p className="text-2xl font-bold">{currency.format(metrics.cpc)}</p>
            </div>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-6 py-4">
            <h2 className="text-lg font-semibold">🎯 Campanhas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-400">
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
                    <td colSpan={9} className="px-6 py-4 text-center text-neutral-500">
                      Nenhuma campanha encontrada
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                      <td className="px-6 py-3 text-neutral-200">{campaign.name}</td>
                      <td className="px-6 py-3 text-right">{currency.format(campaign.spend)}</td>
                      <td className="px-6 py-3 text-right">{number.format(Math.round(campaign.impressions))}</td>
                      <td className="px-6 py-3 text-right">{number.format(Math.round(campaign.clicks))}</td>
                      <td className="px-6 py-3 text-right">{campaign.ctr.toFixed(2)}%</td>
                      <td className="px-6 py-3 text-right">{currency.format(campaign.cpc)}</td>
                      <td className="px-6 py-3 text-right text-green-400">{campaign.conversions}</td>
                      <td className="px-6 py-3 text-right">{currency.format(campaign.cpa)}</td>
                      <td className="px-6 py-3 text-right text-blue-400 font-medium">{campaign.roas.toFixed(2)}x</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Insights */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-6 py-4">
            <h2 className="text-lg font-semibold">📅 Histórico Diário</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-neutral-400">
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
                    <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                      Nenhum dado disponível
                    </td>
                  </tr>
                ) : (
                  dailyInsights.map((insight) => (
                    <tr key={insight.date} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                      <td className="px-6 py-3">{new Date(insight.date).toLocaleDateString("pt-BR")}</td>
                      <td className="px-6 py-3 text-right">{currency.format(insight.spend)}</td>
                      <td className="px-6 py-3 text-right">{number.format(insight.impressions)}</td>
                      <td className="px-6 py-3 text-right">{number.format(insight.clicks)}</td>
                      <td className="px-6 py-3 text-right text-neutral-500">{number.format(insight.reach)}</td>
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
            className="px-6 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm font-medium transition-all"
          >
            🔄 Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
}
