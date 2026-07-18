"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const steps = [
  { label: "Usuário", icon: CheckCircle2 },
  { label: "Empresa", icon: Building2 },
  { label: "Permissões", icon: ShieldCheck },
  { label: "Dashboard", icon: Sparkles },
  { label: "Integrações", icon: Clock3 },
  { label: "Configurações", icon: Clock3 },
];

export function LoadingClient({
  nextPath,
  userName,
}: {
  nextPath: string;
  userName: string;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const start = window.setInterval(() => {
      setProgress((current) => Math.min(current + 16, 96));
    }, 260);

    const redirectTimer = window.setTimeout(() => {
      router.replace(nextPath);
      router.refresh();
    }, 1900);

    return () => {
      window.clearInterval(start);
      window.clearTimeout(redirectTimer);
    };
  }, [nextPath, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,#050816,#0b1224)] px-4 text-slate-100">
      <div className="aurora-blob pointer-events-none absolute -top-28 right-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="aurora-blob pointer-events-none absolute -bottom-28 left-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

      <section className="relative w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10">
          <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
            <div className="subtle-float mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.05] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <Image
                src="/logo_herge.webp"
                alt="Hergé"
                width={96}
                height={96}
                priority
                className="h-16 w-16 object-contain"
              />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
              Autorização em andamento
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Hergé
              <span className="block text-slate-300">
                Inteligência que transforma dados em decisões.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Validando acesso de <span className="font-medium text-slate-200">{userName}</span>,
              carregando empresa ativa, permissões, integrações e o Master Dashboard.
            </p>

            <div className="mt-8 w-full">
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <span>Carregamento seguro</span>
                <span>{Math.min(progress, 96)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/8">
                <div
                  className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 transition-[width] duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                >
                  <span className="loading-shimmer absolute inset-y-0 left-0 w-1/3 bg-white/40 blur-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              <p className="text-sm font-semibold text-white">Preparando ambiente</p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const active = progress >= (index + 1) * 15;

                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      active
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-50"
                        : "border-white/5 bg-white/[0.03] text-slate-400"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active ? "bg-cyan-400/20 text-cyan-200" : "bg-white/[0.04] text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">{step.label}</span>
                    {active && <CheckCircle2 className="ml-auto h-4 w-4 text-cyan-300" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
