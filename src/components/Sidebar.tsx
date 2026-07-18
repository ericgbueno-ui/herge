"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  DollarSign,
  Brain,
  Bell,
  MessageCircle,
  Zap,
  Megaphone,
  Package,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const mainItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Empresas", href: "/companies", icon: Building2 },
  { label: "Usuários", href: "/users", icon: Users },
  { label: "Relatórios", href: "/reports", icon: FileText },
];

const gestaoItems = [
  { label: "Leads", href: "/leads", icon: Users },
  { label: "CRM", href: "/crm", icon: MessageCircle },
  { label: "Conversas", href: "/conversations", icon: MessageCircle, badge: 23 },
  { label: "Campanhas", href: "/campaigns", icon: Megaphone },
  { label: "Anúncios", href: "/ads", icon: Zap },
];

const inteligenciaItems = [
  { label: "IA Insights", href: "/ai-insights", icon: Brain, badge: "Novo" },
  { label: "Alertas", href: "/alerts", icon: Bell },
];

const relatoriosItems = [
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "Dashboards", href: "/dashboards", icon: BarChart3 },
  { label: "Exportações", href: "/exports", icon: FileText },
];

interface SidebarItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isActive?: boolean;
}

function SidebarItem({ label, href, icon: Icon, badge, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-orange-500/10 text-orange-400"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="flex items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  companyId?: string;
}

export function Sidebar({ companyId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto border-r border-slate-700/50 bg-slate-950 pt-20 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="space-y-8 px-4 py-6">
        {/* GESTÃO */}
        <div>
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gestão
          </p>
          <div className="space-y-1">
            {gestaoItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* INTELIGÊNCIA */}
        <div>
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inteligência
          </p>
          <div className="space-y-1">
            {inteligenciaItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* RELATÓRIOS */}
        <div>
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Relatórios
          </p>
          <div className="space-y-1">
            {relatoriosItems.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* CONFIGURAÇÕES */}
        <div>
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Configurações
          </p>
          <div className="space-y-1">
            <SidebarItem
              label="Configurações"
              href="/settings"
              icon={Settings}
              isActive={pathname === "/settings"}
            />
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-slate-700/50 pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400">
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
