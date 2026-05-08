import { GroupResponsibilityRole } from "@/generated/prisma/client";

type ResponsibilityDisplayItem = {
  role: GroupResponsibilityRole;
  user: { name: string };
};

export function responsibilityNames(
  responsibilities: ResponsibilityDisplayItem[],
  role: GroupResponsibilityRole,
  fallback = "",
) {
  const names = responsibilities
    .filter((responsibility) => responsibility.role === role)
    .map((responsibility) => responsibility.user.name);

  return names.length > 0 ? names.join(" e ") : fallback;
}
