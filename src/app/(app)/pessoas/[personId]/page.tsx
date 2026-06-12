import { AppShell } from "@/components/layout/app-shell";
import { getPersonDetailPageData } from "./page-data";
import { PersonDetailContent } from "./person-detail-content";
import { resolvePersonDetailInitialAction } from "./person-detail-initial-action";

type PersonDetailSearchParams = Promise<{ acao?: string | string[] }>;

export default async function PersonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: PersonDetailSearchParams;
}) {
  const [{ personId }, query] = await Promise.all([params, searchParams]);
  const data = await getPersonDetailPageData(personId);
  const initialAction = resolvePersonDetailInitialAction(query.acao);

  return (
    <AppShell
      userName={data.user.name}
      role={data.user.role}
      nav={data.shell.nav}
      headerVariant="compact"
    >
      <PersonDetailContent data={data} initialAction={initialAction} />
    </AppShell>
  );
}
