import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.08),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_rgba(6,10,19,0.94),_rgba(5,8,22,1))]" />
      <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="aurora-blob pointer-events-none fixed -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-amber-400/10 to-cyan-300/10 blur-3xl" />
      <div
        className="aurora-blob pointer-events-none fixed -bottom-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-300/10 to-blue-300/10 blur-3xl"
        style={{ animationDelay: "5s" }}
      />
      <Sidebar />
      <div className="relative min-h-screen pl-72">{children}</div>
    </div>
  );
}
