import { DashboardOverview } from "@/components/DashboardOverview";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  return <DashboardOverview initialCompanyId={companyId || ""} />;
}
