-- Add user activation control for operational access management.
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "users_churchId_isActive_role_idx" ON "users"("churchId", "isActive", "role");
