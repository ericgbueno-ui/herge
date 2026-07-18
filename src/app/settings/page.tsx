"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdAccount {
  id: string;
  name: string;
  externalId: string;
  lastSyncedAt: string | null;
}

export default function SettingsPage() {
  const [metaAccounts, setMetaAccounts] = useState<AdAccount[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<AdAccount[]>([]);
  const [tiktokAccounts, setTikTokAccounts] = useState<AdAccount[]>([]);
  const [shopeeAccounts, setShopeeAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({ token: "", id: "", name: "" });
  const [focusChannel, setFocusChannel] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAccounts();

    const params = new URLSearchParams(window.location.search);
    const channel = params.get("channel");
    if (channel && ["META", "GOOGLE", "TIKTOK", "SHOPEE"].includes(channel)) {
      setShowForm(channel);
      setFocusChannel(channel);
    }
  }, []);

  function clearFocus() {
    setFocusChannel(null);
    window.history.replaceState(null, "", "/settings");
  }

  async function fetchAllAccounts() {
    try {
      setLoading(true);
      const [meta, google, tiktok, shopee] = await Promise.all([
        fetch("/api/auth/meta/accounts").then((r) => r.json()),
        fetch("/api/auth/google/accounts").then((r) => r.json()),
        fetch("/api/auth/tiktok/accounts").then((r) => r.json()),
        fetch("/api/auth/shopee/accounts").then((r) => r.json()),
      ]);

      setMetaAccounts(meta.accounts || []);
      setGoogleAccounts(google.accounts || []);
      setTikTokAccounts(tiktok.accounts || []);
      setShopeeAccounts(shopee.accounts || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(e: React.FormEvent, channel: string) {
    e.preventDefault();
    setConnecting(true);
    setError(null);
    setSuccess(null);

    const endpoints: Record<string, string> = {
      META: "/api/auth/meta/connect",
      GOOGLE: "/api/auth/google/connect",
      TIKTOK: "/api/auth/tiktok/connect",
    };

    const payloads: Record<string, any> = {
      META: { accessToken: formData.token, businessAccountId: formData.id, accountName: formData.name },
      GOOGLE: { refreshToken: formData.token, customerId: formData.id, accountName: formData.name },
      TIKTOK: { accessToken: formData.token, advertiserId: formData.id, accountName: formData.name },
    };

    try {
      const response = await fetch(endpoints[channel], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads[channel]),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Conta ${channel} conectada com sucesso!`);
        setFormData({ token: "", id: "", name: "" });
        setShowForm(null);
        await fetchAllAccounts();
      } else {
        setError(data.error || "Erro ao conectar conta");
      }
    } catch (err) {
      setError("Erro ao conectar conta");
      console.error(err);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Configurações</h1>
        <p className="text-slate-500">Conecte suas contas de ads para sincronizar dados</p>
        {focusChannel && (
          <button
            onClick={clearFocus}
            className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
          >
            Ver todos os canais
          </button>
        )}
      </div>

      {/* Meta Ads Section */}
      {(!focusChannel || focusChannel === "META") && (
      <PlatformSection
        channel="META"
        icon="📘"
        title="Meta Ads"
        description="Facebook & Instagram Ads"
        accounts={metaAccounts}
        loading={loading}
        showForm={showForm === "META"}
        onToggleForm={() => setShowForm(showForm === "META" ? null : "META")}
        formData={formData}
        setFormData={setFormData}
        onSubmit={(e) => handleConnect(e, "META")}
        connecting={connecting}
        error={error}
        tokenPlaceholder="Copie seu token do Meta Business Suite"
        idPlaceholder="act_123456789"
        tokenLabel="Token de Acesso"
        idLabel="ID da Conta de Negócios"
        tokenHint="Obtenha em: business.facebook.com → Configurações → Chaves de app"
        extra={
          <MetaQuickConnect
            onConnected={() => {
              setShowForm(null);
              fetchAllAccounts();
            }}
          />
        }
      />
      )}

      {/* Google Ads Section */}
      {(!focusChannel || focusChannel === "GOOGLE") && (
      <PlatformSection
        channel="GOOGLE"
        icon="🔵"
        title="Google Ads"
        description="Google Search & Display"
        accounts={googleAccounts}
        loading={loading}
        showForm={showForm === "GOOGLE"}
        onToggleForm={() => setShowForm(showForm === "GOOGLE" ? null : "GOOGLE")}
        formData={formData}
        setFormData={setFormData}
        onSubmit={(e) => handleConnect(e, "GOOGLE")}
        connecting={connecting}
        error={error}
        tokenPlaceholder="Cole seu Refresh Token"
        idPlaceholder="1234567890"
        tokenLabel="Refresh Token"
        idLabel="Customer ID"
        tokenHint="Obtenha em: https://myaccount.google.com/permissions (Google Ads API)"
      />
      )}

      {/* TikTok Ads Section */}
      {(!focusChannel || focusChannel === "TIKTOK") && (
      <PlatformSection
        channel="TIKTOK"
        icon="🎵"
        title="TikTok Ads"
        description="TikTok Business Center"
        accounts={tiktokAccounts}
        loading={loading}
        showForm={showForm === "TIKTOK"}
        onToggleForm={() => setShowForm(showForm === "TIKTOK" ? null : "TIKTOK")}
        formData={formData}
        setFormData={setFormData}
        onSubmit={(e) => handleConnect(e, "TIKTOK")}
        connecting={connecting}
        error={error}
        tokenPlaceholder="Cole seu Access Token"
        idPlaceholder="1234567890123456"
        tokenLabel="Access Token"
        idLabel="Advertiser ID"
        tokenHint="Obtenha em: TikTok Business Center → Settings → Apps → Tokens"
      />
      )}

      {/* Shopee Ads Section */}
      {(!focusChannel || focusChannel === "SHOPEE") && (
      <ShopeeSection
        accounts={shopeeAccounts}
        loading={loading}
        showForm={showForm === "SHOPEE"}
        onToggleForm={() => setShowForm(showForm === "SHOPEE" ? null : "SHOPEE")}
        formData={formData}
        setFormData={setFormData}
        onImport={async (csv) => {
          setConnecting(true);
          setError(null);
          setSuccess(null);

          try {
            const response = await fetch("/api/shopee/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                csvContent: csv,
                accountId: formData.id || `shopee-${Date.now()}`,
                accountName: formData.name || "Loja Shopee",
              }),
            });

            const data = await response.json();

            if (response.ok) {
              setSuccess(`Importados ${data.result.synced} campanhas do Shopee!`);
              setFormData({ token: "", id: "", name: "" });
              setShowForm(null);
              await fetchAllAccounts();
            } else {
              setError(data.error || "Erro ao importar");
            }
          } catch (err) {
            setError("Erro ao importar CSV");
            console.error(err);
          } finally {
            setConnecting(false);
          }
        }}
        connecting={connecting}
        error={error}
      />
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}
    </div>
  );
}

function MetaQuickConnect({ onConnected }: { onConnected: () => void }) {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function discover() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/meta/discover");
      const data = await res.json();
      if (data.ok) {
        setAccounts(data.accounts);
      } else {
        setError(data.error || "Erro ao buscar contas");
      }
    } catch (err) {
      setError("Erro ao buscar contas");
    } finally {
      setLoading(false);
    }
  }

  async function connect(id: string, name: string) {
    setConnectingId(id);
    setError(null);
    try {
      const res = await fetch("/api/auth/meta/connect-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: id, accountName: name }),
      });
      const data = await res.json();
      if (res.ok) {
        onConnected();
      } else {
        setError(data.error || "Erro ao conectar conta");
      }
    } catch (err) {
      setError("Erro ao conectar conta");
    } finally {
      setConnectingId(null);
    }
  }

  return (
    <div className="mb-6 p-4 bg-indigo-50/60 ring-1 ring-indigo-100 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-slate-600">Contas já configuradas no sistema</p>
        <button
          type="button"
          onClick={discover}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg bg-white ring-1 ring-slate-200 hover:ring-indigo-300 text-slate-700 font-medium disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar contas"}
        </button>
      </div>

      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}

      {accounts && accounts.length === 0 && (
        <p className="text-sm text-slate-400">Nenhuma conta encontrada no token configurado.</p>
      )}

      {accounts && accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => connect(acc.id, acc.name)}
              disabled={connectingId === acc.id}
              className="w-full text-left flex justify-between items-center p-3 bg-white hover:bg-indigo-50 ring-1 ring-slate-200 hover:ring-indigo-300 rounded-lg text-sm text-slate-800 font-medium disabled:opacity-50 transition"
            >
              <span>
                {acc.name} <span className="text-slate-400 font-mono text-xs">({acc.id})</span>
              </span>
              <span className="text-indigo-600">{connectingId === acc.id ? "Conectando..." : "Usar esta conta →"}</span>
            </button>
          ))}
        </div>
      )}

      {!accounts && (
        <p className="text-xs text-slate-400">
          Clique em "Buscar contas" para listar as contas de anúncio disponíveis no token do sistema.
        </p>
      )}
    </div>
  );
}

function ShopeeSection({
  accounts,
  loading,
  showForm,
  onToggleForm,
  formData,
  setFormData,
  onImport,
  connecting,
  error,
}: {
  accounts: AdAccount[];
  loading: boolean;
  showForm: boolean;
  onToggleForm: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onImport: (csv: string) => void;
  connecting: boolean;
  error: string | null;
}) {
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      alert("Selecione um arquivo CSV");
      return;
    }

    const text = await csvFile.text();
    onImport(text);
    setCsvFile(null);
  };

  return (
    <div id="section-SHOPEE" className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.15)] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">🛍️ Shopee Ads</h2>
          <p className="text-sm text-slate-500">Shopee Seller Center</p>
        </div>
        <button
          onClick={onToggleForm}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-all"
        >
          {showForm ? "Cancelar" : "+ Importar CSV"}
        </button>
      </div>

      {/* Import Form */}
      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleImport();
          }}
          className="space-y-4 mb-6 p-4 bg-orange-50/60 ring-1 ring-orange-100 rounded-xl"
        >
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nome da Loja</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Minha Loja Shopee"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Arquivo CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Colunas esperadas: campaign_name, campaign_id, spend, impressions, clicks, conversions, conversion_value
            </p>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={connecting || !csvFile}
            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-sm font-semibold shadow-md shadow-orange-500/25 disabled:opacity-50 transition"
          >
            {connecting ? "Importando..." : "Importar"}
          </button>
        </form>
      )}

      {/* Accounts List */}
      {loading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : accounts.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhuma loja importada</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="p-3 bg-slate-50 ring-1 ring-slate-100 rounded-xl">
              <p className="text-slate-900 font-medium">{account.name}</p>
              <p className="text-xs text-slate-400">ID: {account.externalId}</p>
              {account.lastSyncedAt && (
                <p className="text-xs text-slate-400">
                  Última importação: {new Date(account.lastSyncedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformSection({
  channel,
  icon,
  title,
  description,
  accounts,
  loading,
  showForm,
  onToggleForm,
  formData,
  setFormData,
  onSubmit,
  connecting,
  error,
  tokenPlaceholder,
  idPlaceholder,
  tokenLabel,
  idLabel,
  tokenHint,
  extra,
}: {
  channel: string;
  icon: string;
  title: string;
  description: string;
  accounts: AdAccount[];
  loading: boolean;
  showForm: boolean;
  onToggleForm: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  connecting: boolean;
  error: string | null;
  tokenPlaceholder: string;
  idPlaceholder: string;
  tokenLabel: string;
  idLabel: string;
  tokenHint: string;
  extra?: React.ReactNode;
}) {
  const [showToken, setShowToken] = useState(false);

  return (
    <div id={`section-${channel}`} className="rounded-2xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200/70 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.15)] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{icon} {title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button
          onClick={onToggleForm}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-all"
        >
          {showForm ? "Cancelar" : "+ Conectar Conta"}
        </button>
      </div>

      {showForm && extra}

      {/* Connect Form */}
      {showForm && (
        <form onSubmit={onSubmit} className="space-y-4 mb-6 p-4 bg-indigo-50/60 ring-1 ring-indigo-100 rounded-xl">
          <div>
            <label className="block text-sm text-slate-600 mb-1">{tokenLabel}</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder={tokenPlaceholder}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">{tokenHint}</p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">{idLabel}</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder={idPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Nome da Conta</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Minha Conta"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              required
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={connecting}
            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 disabled:opacity-50 transition"
          >
            {connecting ? "Conectando..." : "Conectar"}
          </button>
        </form>
      )}

      {/* Accounts List */}
      {loading ? (
        <p className="text-slate-400">Carregando...</p>
      ) : accounts.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhuma conta conectada</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="p-3 bg-slate-50 ring-1 ring-slate-100 rounded-xl">
              <p className="text-slate-900 font-medium">{account.name}</p>
              <p className="text-xs text-slate-400">ID: {account.externalId}</p>
              {account.lastSyncedAt && (
                <p className="text-xs text-slate-400">
                  Última sincronização: {new Date(account.lastSyncedAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
