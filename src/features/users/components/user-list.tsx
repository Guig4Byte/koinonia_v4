import Link from "next/link";
import { Mail, Phone, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  userRoleBadgeTone,
  userRoleLabels,
  userStatusLabel,
  userStatusTone,
} from "@/features/users/user-display";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";

export type ManagedUserListItem = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof userRoleLabels;
  isActive: boolean;
  person: {
    id: string;
    fullName: string;
    phone: string | null;
  } | null;
};

export function UserList({ users, className }: { users: ManagedUserListItem[]; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {users.map((user) => (
        <Card key={user.id} padding="sm" radius="lg" className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[color:var(--color-text-primary)]">{user.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={userRoleBadgeTone[user.role]} size="sm" shape="rounded" maxWidth="none">
                  {userRoleLabels[user.role]}
                </Badge>
                <Badge tone={userStatusTone(user.isActive)} size="sm" shape="rounded" maxWidth="none">
                  {userStatusLabel(user.isActive)}
                </Badge>
              </div>
            </div>
            <ButtonLink href={ROUTES.editUser(user.id)} variant="secondary" size="sm" density="inlineCompact">
              Editar
            </ButtonLink>
          </div>

          <div className="grid gap-2 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
            <p className="flex min-w-0 items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{user.email}</span>
            </p>
            {user.person ? (
              <Link
                href={ROUTES.person(user.person.id)}
                className="flex min-w-0 items-center gap-2 rounded-md underline-offset-4 transition hover:underline"
              >
                {user.person.phone ? (
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                  {user.person.fullName}{user.person.phone ? ` · ${user.person.phone}` : ""}
                </span>
              </Link>
            ) : (
              <p className="flex min-w-0 items-center gap-2">
                <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Sem pessoa vinculada</span>
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
