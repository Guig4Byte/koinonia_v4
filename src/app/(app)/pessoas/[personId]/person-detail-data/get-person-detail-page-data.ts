import { loadPersonDetailContext } from "./person-detail.loader";
import { buildPersonDetailPageData } from "./person-detail.view-model";

export async function getPersonDetailPageData(personId: string) {
  const context = await loadPersonDetailContext(personId);

  return buildPersonDetailPageData(context);
}
