"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  CirclePlus,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  segment: string;
  logo?: string;
  city?: string;
  state?: string;
  status: string;
  userRole: string;
  isOwner: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    segment: "other",
    city: "",
    state: "",
    phone: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/companies");
      const data = await res.json();
      if (data.ok) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Nome da empresa é obrigatório");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/v1/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar empresa");

      setFormData({ name: "", segment: "other", city: "", state: "", phone: "" });
      setShowNewCompanyForm(false);
      await loadCompanies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; text: string; label: string }> = {
      admin: { bg: "bg-rose-500/15", text: "text-rose-200", label: "Administrador" },
      manager: { bg: "bg-sky-500/15", text: "text-sky-200", label: "Gerenciador" },
      analyst: { bg: "bg-emerald-500/15", text: "text-emerald-200", label: "Analista" },
      finance: { bg: "bg-violet-500/15", text: "text-violet-200", label: "Financeiro" },
    };
    const config = roleConfig[role] || roleConfig.analyst;
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#050816,#0b1224)] text-slate-100">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-slate-300">
            <Sparkles className="h-4 w-4 animate-pulse text-cyan-300" />
            Carregando empresas...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(180deg,#050816,#0b1224)] text-slate-100">
      <header className="border-b border-white/8 bg-[#060915]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
                Master • Empresas
              </p>
              <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                Empresas
              </h1>
              <p className="mt-1 text-sm text-slate-400">Suas empresas e campanhas em uma visão consolidada</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] md:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.65)] lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Base operacional
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Central de empresas
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Organize, crie e acesse empresas sem sair da arquitetura enterprise.
              O fluxo continua compatível com as funcionalidades atuais.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Total", String(companies.length)],
              ["Status", "Multiempresa"],
              ["Fluxo", "Master"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {!showNewCompanyForm && (
          <button
            onClick={() => setShowNewCompanyForm(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-blue-400"
          >
            <CirclePlus className="h-4 w-4" />
            Criar Nova Empresa
          </button>
        )}

        {showNewCompanyForm && (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.65)]">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Criar Nova Empresa</h2>
              <p className="mt-1 text-sm text-slate-400">Cadastre uma nova operação na plataforma.</p>
            </div>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nome da empresa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                  required
                />
                <select
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                >
                  <option value="other">Segmento</option>
                  <option value="turismo">Turismo</option>
                  <option value="colchoes">Colchões</option>
                  <option value="clinica">Clínica</option>
                  <option value="imobiliaria">Imobiliária</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="servicos">Serviços</option>
                </select>
                <input
                  type="text"
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                />
                <input
                  type="text"
                  placeholder="Estado"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>
              {error && <p className="text-sm font-medium text-rose-300">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-300 hover:to-blue-400 disabled:opacity-60"
                >
                  {creating ? "Criando..." : "Criar Empresa"}
                </button>
              </div>
            </form>
          </div>
        )}

        {companies.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-12 text-center text-slate-300 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.65)]">
            <p className="text-lg font-medium text-white">Você ainda não tem empresas</p>
            <p className="mt-2 text-sm text-slate-400">Crie uma operação para começar a organizar a plataforma.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/dashboard?companyId=${company.id}`}
                className="group rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.65)] transition hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.06]"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white group-hover:text-cyan-200">
                      {company.name}
                    </h3>
                    {company.city && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {company.city}, {company.state}
                      </p>
                    )}
                  </div>
                  {company.isOwner && (
                    <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-200">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Owner
                    </span>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200 capitalize">
                    {company.segment || "Outro"}
                  </span>
                  {getRoleBadge(company.userRole)}
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                    company.status === "active"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : company.status === "inactive"
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-slate-300"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${company.status === "active" ? "bg-emerald-400" : "bg-slate-400"}`} />
                  {company.status === "active" ? "Ativa" : "Inativa"}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-white/8 py-6 text-center text-sm text-slate-500">
        <p>© 2026 Hergé Enterprise - Inteligência Comercial para Agências</p>
      </footer>
    </div>
  );
}
