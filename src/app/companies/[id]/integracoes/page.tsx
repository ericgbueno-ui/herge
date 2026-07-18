"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { KPICard } from "@/components/KPICard";
import {
  Plus,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  Facebook,
  Globe,
  Music,
  Package,
} from "lucide-react";

const integrationPlatforms = [
  {
    id: "meta_ads",
    name: "Meta Ads",
    icon: <Facebook className="h-8 w-8 text-blue-500" />,
    description: "Facebook & Instagram Advertising",
    status: "connected",
    connectedAt: "2025-06-15",
    lastSync: "2 minutos atrás",
    stats: {
      accounts: 3,
      campaigns: 12,
      activeAds: 45,
      impressions: "1.2M",
      spend: "R$ 8.450",
    },
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: <Globe className="h-8 w-8 text-red-500" />,
    description: "Google Search & Display Ads",
    status: "connected",
    connectedAt: "2025-06-10",
    lastSync: "5 minutos atrás",
    stats: {
      accounts: 2,
      campaigns: 8,
      activeAds: 24,
      impressions: "890K",
      spend: "R$ 6.201",
    },
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    icon: <Music className="h-8 w-8 text-black" />,
    description: "TikTok Advertising Platform",
    status: "connected",
    connectedAt: "2025-07-01",
    lastSync: "30 minutos atrás",
    stats: {
      accounts: 1,
      campaigns: 5,
      activeAds: 18,
      impressions: "650K",
      spend: "R$ 3.800",
    },
  },
  {
    id: "shopee_ads",
    name: "Shopee Ads",
    icon: <Package className="h-8 w-8 text-ee5623" />,
    description: "Shopee E-commerce Advertising",
    status: "pending",
    connectedAt: null,
    lastSync: null,
    stats: null,
  },
];

export default function IntegracionsPage({ params }: { params: { id: string } }) {
  const [integrations, setIntegrations] = useState(integrationPlatforms);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSyncing(null);
  };

  const connected = integrations.filter((i) => i.status === "connected");
  const totalSpend = connected.reduce((acc, i) => {
    const spend = i.stats?.spend
      ? parseFloat(i.stats.spend.replace("R$ ", "").replace(".", "").replace(",", "."))
      : 0;
    return acc + spend;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header
        title="Integrações"
        subtitle="Conecte suas plataformas de anúncios e sincronize dados em tempo real."
      />
      <Sidebar companyId={params.id} />

      <main className="ml-64 pt-24 px-8 pb-12">
        {/* Summary KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <KPICard
            label="Plataformas Conectadas"
            value={`${connected.length}/${integrations.length}`}
            change={20}
            changeLabel="vs mês anterior"
            color="blue"
            sparkline={[1, 2, 2, 3, 3, 4, 4, 4]}
          />
          <KPICard
            label="Gastos Totais"
            value={`R$ ${totalSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            change={15.3}
            changeLabel="vs período anterior"
            color="green"
            sparkline={[3000, 4500, 5200, 6100, 7500, 8200, 8400, 8450]}
          />
          <KPICard
            label="Total de Campanhas"
            value={connected.reduce((acc, i) => (acc += i.stats?.campaigns || 0), 0).toString()}
            change={8.5}
            changeLabel="vs período anterior"
            color="orange"
            sparkline={[15, 18, 20, 25, 27, 29, 30, 29]}
          />
        </div>

        {/* Integration Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {integrations.map((platform) => (
            <div
              key={platform.id}
              className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 backdrop-blur-sm"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-slate-800 p-3">{platform.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-slate-400">{platform.description}</p>
                  </div>
                </div>
                {platform.status === "connected" ? (
                  <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Conectado
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    Pendente
                  </div>
                )}
              </div>

              {platform.stats ? (
                <>
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Contas
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {platform.stats.accounts}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Campanhas
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {platform.stats.campaigns}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Anúncios
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {platform.stats.activeAds}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        Gasto
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {platform.stats.spend}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 border-t border-slate-700/50 pt-4">
                    <p className="text-xs text-slate-400">
                      Conectado em {platform.connectedAt} • Última sincronização:{" "}
                      {platform.lastSync}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(platform.id)}
                      disabled={syncing === platform.id}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${syncing === platform.id ? "animate-spin" : ""}`}
                      />
                      Sincronizar
                    </button>
                    <button className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Conecte sua conta {platform.name} para começar a sincronizar dados.
                  </p>
                  <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
                    <Plus className="h-4 w-4" />
                    Conectar Agora
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Documentation */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-100">
            Como Conectar Suas Plataformas
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p>
              1. Clique no botão "Conectar Agora" para qualquer plataforma que deseja integrar
            </p>
            <p>
              2. Você será redirecionado para fazer login na plataforma e autorizar o acesso
            </p>
            <p>3. Após a autorização, seus dados serão sincronizados automaticamente</p>
            <p>4. Clique em "Sincronizar" a qualquer momento para atualizar os dados</p>
          </div>
        </div>
      </main>
    </div>
  );
}
