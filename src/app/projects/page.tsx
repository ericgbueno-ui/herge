"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ConnectedAccount {
  id: string;
  name: string;
  externalId: string;
}

const CHANNELS = [
  {
    id: "META",
    name: "Meta Ads",
    icon: "📘",
    image: "/images/icon_meta.webp",
    description: "Facebook & Instagram Ads",
    gradient: "from-blue-500 to-indigo-500",
    ring: "hover:ring-blue-200",
  },
  {
    id: "GOOGLE",
    name: "Google Ads",
    icon: "🔵",
    image: "/images/icon_google-ads-640x640.webp",
    description: "Google Search & Display",
    gradient: "from-emerald-500 to-teal-500",
    ring: "hover:ring-emerald-200",
  },
  {
    id: "TIKTOK",
    name: "TikTok Ads",
    icon: "🎵",
    image: "/images/icon_tik-tok-ads.webp",
    description: "TikTok Business Center",
    gradient: "from-sky-500 to-cyan-500",
    ring: "hover:ring-sky-200",
  },
  {
    id: "SHOPEE",
    name: "Shopee Ads",
    icon: "🛍️",
    image: "/images/icon_shopee-ads.webp",
    description: "Shopee Seller Center",
    gradient: "from-orange-500 to-amber-500",
    ring: "hover:ring-orange-200",
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [metaAccounts, setMetaAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channel = params.get("channel");
    if (channel && CHANNELS.some((c) => c.id === channel)) {
      setSelectedChannel(channel);
    }
  }, []);

  useEffect(() => {
    if (selectedChannel === "META") {
      fetchAccounts("/api/auth/meta/accounts");
    } else if (selectedChannel === "GOOGLE") {
      fetchAccounts("/api/auth/google/accounts");
    } else if (selectedChannel === "TIKTOK") {
      fetchAccounts("/api/auth/tiktok/accounts");
    } else if (selectedChannel === "SHOPEE") {
      fetchAccounts("/api/auth/shopee/accounts");
    }
  }, [selectedChannel]);

  async function fetchAccounts(endpoint: string) {
    setLoadingMeta(true);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.ok) {
        setMetaAccounts(data.accounts);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoadingMeta(false);
    }
  }

  function handleSelectAccount(accountId: string, channel: string) {
    localStorage.setItem("selectedChannel", channel);
    localStorage.setItem("selectedAccount", accountId);
    router.push("/dashboard");
  }

  // All platforms now use real data
  const accounts = ["META", "GOOGLE", "TIKTOK", "SHOPEE"].includes(selectedChannel || "")
    ? metaAccounts
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-6 py-12 text-slate-900">
      <div className="aurora-blob pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-400/30 to-cyan-300/30 blur-3xl" />
      <div className="aurora-blob pointer-events-none absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-300/30 to-blue-300/30 blur-3xl" style={{ animationDelay: "3s" }} />

      <div className="relative max-w-4xl mx-auto">
        {/* Header with Settings Link */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent mb-2">
              Hergé
            </h1>
            <p className="text-lg text-slate-500">
              {selectedChannel ? "Selecione uma conta" : "Selecione o canal de ads"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/meta-ads"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all"
              title="Dashboard em tempo real do Meta Ads"
            >
              📘 Meta Ads Dashboard
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl bg-white ring-1 ring-slate-200 hover:ring-indigo-300 text-sm font-medium text-slate-600 shadow-sm transition-all"
            >
              ⚙️ Configurações
            </Link>
          </div>
        </div>

        {/* Canais ou Contas */}
        {!selectedChannel ? (
          // Step 1: Select Channel
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`group relative overflow-hidden text-left rounded-3xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_30px_-15px_rgba(15,23,42,0.15)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.4)] ${channel.ring}`}
              >
                {/* Logo Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity">
                  <Image
                    src={channel.image}
                    alt=""
                    width={300}
                    height={300}
                    className="w-96 h-96 object-cover"
                  />
                </div>

                {/* Content */}
                <div className="relative p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-20 w-20 flex items-center justify-center">
                      <Image
                        src={channel.image}
                        alt={channel.name}
                        width={80}
                        height={80}
                        className="object-contain drop-shadow-lg"
                      />
                    </div>
                    <div className="text-slate-300 text-3xl transition group-hover:translate-x-2 group-hover:text-indigo-400">→</div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{channel.name}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{channel.description}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Step 2: Select Account
          <>
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => {
                  window.history.replaceState(null, "", "/projects");
                  setSelectedChannel(null);
                }}
                className="px-4 py-2 text-sm bg-white ring-1 ring-slate-200 hover:ring-indigo-300 rounded-xl shadow-sm transition-all text-slate-600"
              >
                ← Voltar uma seção
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("selectedChannel");
                  localStorage.removeItem("selectedAccount");
                  window.history.replaceState(null, "", "/projects");
                  setSelectedChannel(null);
                }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600"
              >
                🏠 Voltar para o início
              </button>
            </div>

            {loadingMeta && selectedChannel === "META" ? (
              <p className="text-slate-400">Carregando contas...</p>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">
                  Nenhuma conta {CHANNELS.find((c) => c.id === selectedChannel)?.name} conectada
                </p>
                <Link
                  href={`/settings?channel=${selectedChannel}`}
                  className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all"
                >
                  Conectar conta {CHANNELS.find((c) => c.id === selectedChannel)?.name}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() =>
                      handleSelectAccount(
                        account.externalId || account.id,
                        selectedChannel
                      )
                    }
                    className="group w-full text-left p-4 rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-sm hover:ring-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{account.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">
                          ID: {account.externalId}
                        </p>
                      </div>
                      <div className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">→</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Or create new */}
        {!selectedChannel && (
          <div className="mt-12 p-6 rounded-2xl border border-dashed border-indigo-200 bg-white/60 backdrop-blur-sm text-center">
            <p className="text-slate-500">
              Não vê sua conta? <br />
              <Link href="/settings" className="font-medium text-indigo-600 hover:underline">
                Configure uma nova conta em Configurações
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
