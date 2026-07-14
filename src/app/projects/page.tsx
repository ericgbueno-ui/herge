"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    description: "Facebook & Instagram Ads",
  },
  {
    id: "GOOGLE",
    name: "Google Ads",
    icon: "🔵",
    description: "Google Search & Display",
  },
  {
    id: "TIKTOK",
    name: "TikTok Ads",
    icon: "🎵",
    description: "TikTok Business Center",
  },
  {
    id: "SHOPEE",
    name: "Shopee Ads",
    icon: "🛍️",
    description: "Shopee Seller Center",
  },
];

// No more mock accounts - all platforms use real data
const MOCK_ACCOUNTS: Record<string, Array<{ id: string; name: string; businessId: string }>> = {};

export default function ProjectsPage() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [metaAccounts, setMetaAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header with Settings Link */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Hergé</h1>
            <p className="text-lg text-neutral-400">
              {selectedChannel ? "Selecione uma conta" : "Selecione o canal de ads"}
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-300 transition-all"
          >
            ⚙️ Configurações
          </Link>
        </div>

        {/* Canais ou Contas */}
        {!selectedChannel ? (
          // Step 1: Select Channel
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className="text-left p-8 rounded-lg border border-neutral-800 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800 transition-all"
              >
                <div className="text-4xl mb-4">{channel.icon}</div>
                <h2 className="text-2xl font-semibold mb-2">{channel.name}</h2>
                <p className="text-neutral-400">{channel.description}</p>
                <div className="mt-6 text-neutral-600">→</div>
              </button>
            ))}
          </div>
        ) : (
          // Step 2: Select Account
          <>
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setSelectedChannel(null)}
                className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-md transition-all"
              >
                ← Voltar uma seção
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("selectedChannel");
                  localStorage.removeItem("selectedAccount");
                  setSelectedChannel(null);
                }}
                className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded-md transition-all text-neutral-300"
              >
                🏠 Voltar para o início
              </button>
            </div>

            {loadingMeta && selectedChannel === "META" ? (
              <p className="text-neutral-400">Carregando contas...</p>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400 mb-4">Nenhuma conta {selectedChannel === "META" ? "Meta Ads" : "disponível"} conectada</p>
                {selectedChannel === "META" && (
                  <Link
                    href="/settings"
                    className="inline-block px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-300 transition-all"
                  >
                    Conectar conta Meta Ads
                  </Link>
                )}
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
                    className="w-full text-left p-4 rounded-lg border border-neutral-800 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{account.name}</h3>
                        <p className="text-xs text-neutral-500 font-mono">
                          ID: {account.externalId || account.businessId}
                        </p>
                      </div>
                      <div className="text-neutral-600">→</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Or create new */}
        {!selectedChannel && (
          <div className="mt-12 p-6 rounded-lg border border-dashed border-neutral-700 text-center">
            <p className="text-neutral-400">
              Não vê sua conta? <br />
              <Link href="/settings" className="text-blue-400 hover:underline">
                Configure uma nova conta em Configurações
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
