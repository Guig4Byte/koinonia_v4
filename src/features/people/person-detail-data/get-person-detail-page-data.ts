import { loadPersonDetailContext, type PersonDetailViewer } from "./person-detail.loader";
import { buildPersonDetailPageData } from "./person-detail.view-model";

export async function getPersonDetailPageData(user: PersonDetailViewer, personId: string) {
  const context = await loadPersonDetailContext(user, personId);

  if (!context) return null;

  return buildPersonDetailPageData(context);
}
