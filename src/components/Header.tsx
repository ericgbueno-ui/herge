"use client";

import {
  Bell,
  Building2,
  ChevronDown,
  Plus,
  Search,
  UserCircle2,
} from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
}

export function Header({
  title = "Visão Geral",
  subtitle,
  actionLabel = "Nova Empresa",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(4,8,19,0.86)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <Building2 className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[28px] font-semibold tracking-tight text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-xl lg:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Pesquisa global"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-11 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-400/10"
            />
          </label>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.07] xl:flex">
            Empresa ativa
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          <button className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.07] md:inline-flex">
            <Bell className="h-4 w-4 text-slate-300" />
            <span className="absolute -mt-6 ml-4 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <button className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.07] md:flex">
            Tema
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          <button className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-white/[0.05]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top_left,_#67e8f9,_#2563eb)] text-sm font-bold text-white shadow-[0_0_24px_rgba(37,99,235,0.2)]">
              <UserCircle2 className="h-5 w-5" />
            </span>
            <span className="hidden text-left lg:block">
              <span className="block text-sm font-semibold text-white">Eric Bueno</span>
              <span className="block text-[11px] text-slate-400">Administrador Master</span>
            </span>
          </button>

          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-colors hover:from-cyan-300 hover:to-blue-400">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
