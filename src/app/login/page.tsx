"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccess, setRememberAccess] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha inválidos.");
      return;
    }

    router.push("/loading");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.16),_transparent_24%),linear-gradient(180deg,#f8fbff,#eef4ff)] px-4 py-8 text-slate-900">
      <div className="aurora-blob pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/30 to-cyan-300/20 blur-3xl" />
      <div
        className="aurora-blob pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-300/30 to-emerald-200/20 blur-3xl"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative grid w-full max-w-5xl gap-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-8 text-white md:p-10">
          <div>
            <Image
              src="/logo_herge.webp"
              alt="Hergé"
              width={180}
              height={72}
              priority
              className="h-auto w-40 object-contain"
            />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              Plataforma enterprise
            </p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight md:text-5xl">
              Hergé
              <span className="mt-2 block text-slate-300">
                Inteligência que transforma dados em decisões.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
              Acesso premium para operação multiempresa, com autorização,
              dashboards, integrações e controle central em um só ambiente.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Fluxo</p>
              <p className="mt-2 font-medium text-white">Login → Loading → Dashboard</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Modo</p>
              <p className="mt-2 font-medium text-white">Enterprise premium</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center p-8 md:p-10"
        >
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Entrar na plataforma
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Acesse seu dashboard master, valide permissões e continue a operação
              sem fricção.
            </p>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Senha</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 pr-12 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberAccess}
                    onChange={(e) => setRememberAccess(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Lembrar acesso
                </label>
                <a
                  href="#"
                  className="font-medium text-cyan-700 transition hover:text-cyan-800"
                  onClick={(e) => e.preventDefault()}
                >
                  Esqueci minha senha
                </a>
              </div>

              {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#0f172a,#1d4ed8)] px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Acesso restrito. Suporte e recuperação de conta via time interno.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
