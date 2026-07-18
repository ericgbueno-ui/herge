"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Settings, User } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image
              src="/logo_herge.webp"
              alt="HERGÉ Agency"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">HERGÉ Agency</h1>
            <p className="text-xs text-slate-400">Inteligência que conecta resultados</p>
          </div>
        </Link>

        {/* Center - Title */}
        {title && (
          <div className="flex-1 px-8">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 hover:bg-slate-800 transition-colors">
            <Bell className="h-5 w-5 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
          </button>

          {/* Settings */}
          <button className="rounded-lg p-2 hover:bg-slate-800 transition-colors">
            <Settings className="h-5 w-5 text-slate-400" />
          </button>

          {/* Profile */}
          <button className="rounded-lg p-2 hover:bg-slate-800 transition-colors">
            <User className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
