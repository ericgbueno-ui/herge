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
  const [pendingScrollChannel, setPendingScrollChannel] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAccounts();

    const params = new URLSearchParams(window.location.search);
    const channel = params.get("channel");
    if (channel && ["META", "GOOGLE", "TIKTOK", "SHOPEE"].includes(channel)) {
      setShowForm(channel);
      setPendingScrollChannel(channel);
    }
  }, []);

  useEffect(() => {
    if (!loading && pendingScrollChannel) {
      document.getElementById(`section-${pendingScrollChannel}`)?.scrollIntoView({ behavior: "auto", block: "start" });
      setPendingScrollChannel(null);
    }
  }, [loading, pendingScrollChannel]);

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
        <Link href="/projects" className="text-sm text-neutral-400 hover:text-neutral-200 mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100 mb-2">Configurações</h1>
        <p className="text-neutral-400">Conecte suas contas de ads para sincronizar dados</p>
      </div>

      {/* Meta Ads Section */}
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
      />

      {/* Google Ads Section */}
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

      {/* TikTok Ads Section */}
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

      {/* Shopee Ads Section */}
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

      {/* Success Message */}
      {success && (
        <div className="p-4 rounded-lg bg-green-900 border border-green-700 text-green-100 text-sm">
          {success}
        </div>
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
    <div id="section-SHOPEE" className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">🛍️ Shopee Ads</h2>
          <p className="text-sm text-neutral-400">Shopee Seller Center</p>
        </div>
        <button
          onClick={onToggleForm}
          className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-100 transition-all"
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
          className="space-y-4 mb-6 p-4 bg-neutral-800 rounded-md"
        >
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Nome da Loja</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Minha Loja Shopee"
              className="w-full px-3 py-2 rounded-md border border-neutral-700 bg-neutral-700 text-neutral-100 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Arquivo CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 rounded-md border border-neutral-700 bg-neutral-700 text-neutral-100 text-sm"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Colunas esperadas: campaign_name, campaign_id, spend, impressions, clicks, conversions, conversion_value
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={connecting || !csvFile}
            className="w-full px-4 py-2 rounded-md bg-neutral-100 text-neutral-900 text-sm font-medium disabled:opacity-50 hover:bg-neutral-200"
          >
            {connecting ? "Importando..." : "Importar"}
          </button>
        </form>
      )}

      {/* Accounts List */}
      {loading ? (
        <p className="text-neutral-400">Carregando...</p>
      ) : accounts.length === 0 ? (
        <p className="text-neutral-400 text-sm">Nenhuma loja importada</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="p-3 bg-neutral-800 rounded-md">
              <p className="text-neutral-100 font-medium">{account.name}</p>
              <p className="text-xs text-neutral-500">ID: {account.externalId}</p>
              {account.lastSyncedAt && (
                <p className="text-xs text-neutral-500">
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
}) {
  return (
    <div id={`section-${channel}`} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{icon} {title}</h2>
          <p className="text-sm text-neutral-400">{description}</p>
        </div>
        <button
          onClick={onToggleForm}
          className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm font-medium text-neutral-100 transition-all"
        >
          {showForm ? "Cancelar" : "+ Conectar Conta"}
        </button>
      </div>

      {/* Connect Form */}
      {showForm && (
        <form onSubmit={onSubmit} className="space-y-4 mb-6 p-4 bg-neutral-800 rounded-md">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">{tokenLabel}</label>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              placeholder={tokenPlaceholder}
              className="w-full px-3 py-2 rounded-md border border-neutral-700 bg-neutral-700 text-neutral-100 text-sm"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">{tokenHint}</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">{idLabel}</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder={idPlaceholder}
              className="w-full px-3 py-2 rounded-md border border-neutral-700 bg-neutral-700 text-neutral-100 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Nome da Conta</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Minha Conta"
              className="w-full px-3 py-2 rounded-md border border-neutral-700 bg-neutral-700 text-neutral-100 text-sm"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={connecting}
            className="w-full px-4 py-2 rounded-md bg-neutral-100 text-neutral-900 text-sm font-medium disabled:opacity-50 hover:bg-neutral-200"
          >
            {connecting ? "Conectando..." : "Conectar"}
          </button>
        </form>
      )}

      {/* Accounts List */}
      {loading ? (
        <p className="text-neutral-400">Carregando...</p>
      ) : accounts.length === 0 ? (
        <p className="text-neutral-400 text-sm">Nenhuma conta conectada</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="p-3 bg-neutral-800 rounded-md">
              <p className="text-neutral-100 font-medium">{account.name}</p>
              <p className="text-xs text-neutral-500">ID: {account.externalId}</p>
              {account.lastSyncedAt && (
                <p className="text-xs text-neutral-500">
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
