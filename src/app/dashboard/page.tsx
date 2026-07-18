import { Header } from "@/components/Header";
import { DashboardOverview } from "@/components/DashboardOverview";

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard Master"
        subtitle="Fluxo consolidado de receita, aquisição, operação e performance multiempresa."
      />
      <main className="space-y-6 px-6 py-6 lg:px-8">
        <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.55)] lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              Fase 01
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Organização da navegação, shell enterprise e leitura executiva dos dados.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Esta etapa mantém as funcionalidades atuais, mas reorganiza a experiência
              para abrir diretamente no painel master após a autorização.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Fluxo", "Login → Loading → Dashboard"],
              ["Escopo", "UX + navegação"],
              ["Status", "Compatível com o legado"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/8 bg-slate-950/40 p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <DashboardOverview />
      </main>
    </>
  );
}
