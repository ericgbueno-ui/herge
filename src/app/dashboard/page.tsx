"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { PeriodType } from "@/lib/dashboard/advanced-queries";
import { useEffect } from "react";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const number = new Intl.NumberFormat("pt-BR");

export default function DashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodType>("30d");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>("Projeto");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Exige canal e conta selecionados; sem isso, volta para a seleção
    const channel = localStorage.getItem("selectedChannel");
    const accountId = localStorage.getItem("selectedAccount");

    if (!channel || !accountId) {
      router.push("/projects");
      return;
    }
    setReady(true);

    const accountNames: Record<string, Record<string, string>> = {
      META: {
        "meta-001": "Meta Ads - Conta Principal",
        "meta-002": "Meta Ads - Conta Secundária",
        "meta-003": "Meta Ads - Testes",
      },
      GOOGLE: {
        "google-001": "Google Ads - MCC Principal",
        "google-002": "Google Ads - Performance Max",
        "google-003": "Google Ads - Search Ads",
      },
      TIKTOK: {
        "tiktok-001": "TikTok Ads - E-commerce",
        "tiktok-002": "TikTok Ads - Brand Awareness",
      },
      SHOPEE: {
        "shopee-001": "Shopee Ads - Loja Principal",
        "shopee-002": "Shopee Ads - Loja Secundária",
      },
    };

    const name = accountNames[channel]?.[accountId] || `${channel} - ${accountId}`;
    setProjectName(name);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/metrics?period=${period}`);
        const data = await response.json();

        if (data.ok) {
          setCampaigns(data.campaigns || []);
          setFunnel(data.funnel || []);
          setRanking(data.ranking || []);
        } else {
          console.error("API error:", data.error);
          setCampaigns([]);
          setFunnel([]);
          setRanking([]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setCampaigns([]);
        setFunnel([]);
        setRanking([]);
      }
      setLoading(false);
    }
    loadData();
  }, [period]);

  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
  const totalConversionValue = campaigns.reduce((acc, c) => acc + c.conversionValue, 0);
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : null;
  const roas = totalSpend > 0 ? totalConversionValue / totalSpend : null;

  if (!ready) {
    return (
      <div className="text-center text-neutral-400">Redirecionando...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-100">Dashboard de Campanhas</h1>
        <a
          href={`/api/reports/export-csv?period=${period}&include_offline=true`}
          download
          className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-700"
        >
          📥 Baixar CSV
        </a>
      </div>

      <PeriodSelector value={period} onChange={setPeriod} />

      {loading ? (
        <div className="text-center text-neutral-400">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Gasto total" value={currency.format(totalSpend)} />
            <KpiCard label="Conversões" value={number.format(totalConversions)} />
            <KpiCard label="CPA médio" value={avgCPA !== null ? currency.format(avgCPA) : "—"} />
            <KpiCard label="ROAS" value={roas !== null ? `${roas.toFixed(2)}x` : "—"} />
          </div>

          <ConversionFunnel steps={funnel} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Benchmark Ranking */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900">
              <div className="border-b border-neutral-800 px-4 py-3">
                <h2 className="text-sm font-medium text-neutral-200">🏆 Campanhas Mais Eficientes (CPA)</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="px-4 py-2 font-normal">#</th>
                    <th className="px-4 py-2 font-normal">Campanha</th>
                    <th className="px-4 py-2 font-normal">CPA</th>
                    <th className="px-4 py-2 font-normal">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.slice(0, 5).map((r) => (
                    <tr key={r.campaignName} className="border-b border-neutral-900 text-neutral-200">
                      <td className="px-4 py-2 text-yellow-400 font-semibold">{r.rank}</td>
                      <td className="px-4 py-2 text-neutral-300">{r.campaignName}</td>
                      <td className="px-4 py-2">{currency.format(r.cpa)}</td>
                      <td className="px-4 py-2 text-green-400">{r.roas.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Todas as Campanhas */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900">
              <div className="border-b border-neutral-800 px-4 py-3">
                <h2 className="text-sm font-medium text-neutral-200">📊 Todas as Campanhas</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-neutral-400">
                    <th className="px-4 py-2 font-normal">Campanha</th>
                    <th className="px-4 py-2 font-normal">Gasto</th>
                    <th className="px-4 py-2 font-normal">CPA</th>
                    <th className="px-4 py-2 font-normal">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 10).map((c) => (
                    <tr key={c.id} className="border-b border-neutral-900 text-neutral-200">
                      <td className="px-4 py-2 truncate text-neutral-300">{c.name}</td>
                      <td className="px-4 py-2">{currency.format(c.spend)}</td>
                      <td className="px-4 py-2">{currency.format(c.cpa)}</td>
                      <td className="px-4 py-2 text-green-400">{c.roas.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
