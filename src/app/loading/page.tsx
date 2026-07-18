import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoadingClient } from "./loading-client";

export default async function LoadingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const nextPath = params.next || "/dashboard";

  return (
    <LoadingClient
      nextPath={nextPath}
      userName={session.user.name || session.user.email || "usuário"}
    />
  );
}
