import { notFound } from "next/navigation";
import { canViewGroup, type PermissionUser } from "@/features/permissions/permissions";
import { buildGroupDetailPageModel, readGroupDetailPageOptions } from "./page-data-view-model";
import { getGroupDetailRecord, getGroupPresenceEvents } from "./page-data.queries";

type GroupDetailSearchParams = Record<string, string | string[] | undefined>;

export async function getGroupDetailPageData({
  user,
  groupId,
  queryParams,
}: {
  user: PermissionUser;
  groupId: string;
  queryParams: GroupDetailSearchParams;
}) {
  const options = readGroupDetailPageOptions(queryParams);
  const group = await getGroupDetailRecord(groupId);

  if (!group || !canViewGroup(user, group)) notFound();

  const presenceEvents = await getGroupPresenceEvents({
    churchId: group.churchId,
    groupId: group.id,
    referenceDate: options.referenceDate,
  });

  return buildGroupDetailPageModel({
    user,
    group,
    presenceEvents,
    options,
  });
}
