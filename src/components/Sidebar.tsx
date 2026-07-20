"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Megaphone, Plug, Settings } from "lucide-react";

const navigation = [
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/companies", icon: Building2 },
  { label: "Mídia", href: "/meta-ads", icon: Megaphone },
  { label: "Integrações", href: "/settings", icon: Plug },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/5 bg-[linear-gradient(180deg,rgba(5,8,22,0.98),rgba(7,10,24,0.98))]">
      <Link href="/dashboard" className="flex items-center justify-center border-b border-white/5 px-5 py-4">
        <Image src="/logo_herge.webp" alt="Hergé" width={200} height={96} priority className="h-auto w-full max-w-[190px] object-contain" />
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Gestão</p>
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? "border border-cyan-400/20 bg-cyan-500/10 text-cyan-200" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}><Icon className="h-4 w-4" /><span>{label}</span></Link>;
        })}
      </nav>
      <div className="border-t border-white/5 p-4">
        <p className="text-sm font-semibold text-white">Hergel</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Gestão centralizada e dados isolados por cliente.</p>
      </div>
    </aside>
  );
}
