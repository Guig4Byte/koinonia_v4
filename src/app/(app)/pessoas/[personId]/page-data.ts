import { notFound } from "next/navigation";
import { getPersonDetailPageData as getFeaturePersonDetailPageData } from "@/features/people/person-detail-data/get-person-detail-page-data";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function getPersonDetailPageData(personId: string) {
  const user = await getCurrentUser();
  const data = await getFeaturePersonDetailPageData(user, personId);

  if (!data) notFound();

  return data;
}
