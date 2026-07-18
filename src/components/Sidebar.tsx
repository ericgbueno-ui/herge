"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  DollarSign,
  FileBarChart,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Megaphone,
  Plug,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

const navigation = [
  {
    title: "Master",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Empresas", href: "/companies", icon: Building2 },
    ],
  },
  {
    title: "Operação",
    items: [
      { label: "CRM", icon: Handshake, disabled: true, badge: "Em breve" },
      { label: "Leads", icon: Users, disabled: true, badge: "Em breve" },
      { label: "Campanhas", icon: Megaphone, disabled: true, badge: "Em breve" },
      { label: "Marketing", href: "/meta-ads", icon: Zap },
      { label: "WhatsApp", icon: MessageCircle, disabled: true, badge: "Em breve" },
      { label: "Financeiro", icon: DollarSign, disabled: true, badge: "Em breve" },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Relatórios", icon: FileBarChart, disabled: true, badge: "Em breve" },
      { label: "Integrações", href: "/settings", icon: Plug },
      { label: "IA", icon: Bell, disabled: true, badge: "Em breve" },
    ],
  },
  {
    title: "Administração",
    items: [
      { label: "Usuários", icon: Users, disabled: true, badge: "Em breve" },
      { label: "Configurações", href: "/settings", icon: Settings },
      { label: "Perfil", icon: ShieldCheck, disabled: true, badge: "Em breve" },
    ],
  },
];

interface SidebarItemProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
  disabled?: boolean;
  href?: string;
}

function SidebarItem({
  label,
  href,
  icon: Icon,
  badge,
  isActive,
  disabled,
}: SidebarItemProps) {
  const base =
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all";
  const active =
    "border border-cyan-400/20 bg-[linear-gradient(90deg,rgba(6,182,212,0.14),rgba(37,99,235,0.05))] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]";
  const idle = "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100";
  const inactive = "cursor-not-allowed text-slate-600";

  const content = (
    <>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span
          className={`flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
            typeof badge === "number"
              ? "bg-amber-500 text-slate-950"
              : "bg-cyan-500/15 text-cyan-200"
          }`}
        >
          {badge}
        </span>
      )}
    </>
  );

  if (disabled || !href) {
    return (
      <button type="button" disabled className={`${base} w-full ${inactive}`}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={`${base} ${isActive ? active : idle}`}>
      {content}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/5 bg-[linear-gradient(180deg,rgba(5,8,22,0.98),rgba(7,10,24,0.98))]">
      <Link href="/dashboard" className="flex items-center justify-center border-b border-white/5 px-5 py-4">
        <Image
          src="/logo_herge.webp"
          alt="Hergé — Inteligência que transforma dados em decisões"
          width={200}
          height={96}
          priority
          className="h-auto w-full max-w-[190px] object-contain"
        />
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
        {navigation.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem
                  key={item.label}
                  {...item}
                  isActive={!!item.href && pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Empresa ativa
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-100">Hergé Master</span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Pesquisa global, permissões e contexto centralizados.
          </p>
        </button>
      </div>
    </aside>
  );
}
