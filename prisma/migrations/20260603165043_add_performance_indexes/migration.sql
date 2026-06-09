-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PASTOR', 'SUPERVISOR', 'LEADER');

-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'VISITOR', 'NEW', 'NEEDS_ATTENTION', 'COOLING_AWAY', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GroupKind" AS ENUM ('CELL', 'GROUP');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'VISITOR', 'HOST', 'LEADER');

-- CreateEnum
CREATE TYPE "GroupResponsibilityRole" AS ENUM ('LEADER', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CELL_MEETING', 'SERVICE', 'TRAINING', 'RETREAT', 'LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'CHECKIN_OPEN', 'COMPLETED', 'CANCELLED', 'NO_MEETING');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'JUSTIFIED', 'VISITOR');

-- CreateEnum
CREATE TYPE "SignalSeverity" AS ENUM ('INFO', 'ATTENTION', 'URGENT');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "SignalSource" AS ENUM ('ATTENDANCE', 'VISITOR', 'NO_CONTACT', 'MANUAL');

-- CreateEnum
CREATE TYPE "CareKind" AS ENUM ('CALL', 'WHATSAPP', 'VISIT', 'PRAYER', 'MARKED_CARED', 'NOTE', 'REQUESTED_SUPPORT', 'ESCALATED_TO_PASTOR');

-- CreateTable
CREATE TABLE "churches" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "personId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
    "shortNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GroupKind" NOT NULL DEFAULT 'CELL',
    "meetingDayOfWeek" INTEGER,
    "meetingTime" TEXT,
    "locationName" TEXT,
    "eventsGeneratedUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_responsibilities" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "GroupResponsibilityRole" NOT NULL,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_memberships" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "groupId" UUID,
    "createdById" UUID,
    "type" "EventType" NOT NULL DEFAULT 'CELL_MEETING',
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "locationName" TEXT,
    "generatedFromSchedule" BOOLEAN NOT NULL DEFAULT false,
    "scheduleStartsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_signals" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "groupId" UUID,
    "assignedToId" UUID,
    "source" "SignalSource" NOT NULL,
    "severity" "SignalSeverity" NOT NULL DEFAULT 'ATTENTION',
    "status" "SignalStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEvidenceAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "care_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_touches" (
    "id" UUID NOT NULL,
    "churchId" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "groupId" UUID,
    "actorId" UUID,
    "kind" "CareKind" NOT NULL,
    "note" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_touches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "churches_slug_key" ON "churches"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_personId_key" ON "users"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_churchId_role_idx" ON "users"("churchId", "role");

-- CreateIndex
CREATE INDEX "people_churchId_status_idx" ON "people"("churchId", "status");

-- CreateIndex
CREATE INDEX "people_churchId_fullName_idx" ON "people"("churchId", "fullName");

-- CreateIndex
CREATE INDEX "groups_churchId_isActive_idx" ON "groups"("churchId", "isActive");

-- CreateIndex
CREATE INDEX "groups_churchId_isActive_meetingDayOfWeek_idx" ON "groups"("churchId", "isActive", "meetingDayOfWeek");

-- CreateIndex
CREATE INDEX "group_responsibilities_churchId_role_idx" ON "group_responsibilities"("churchId", "role");

-- CreateIndex
CREATE INDEX "group_responsibilities_groupId_role_activeUntil_idx" ON "group_responsibilities"("groupId", "role", "activeUntil");

-- CreateIndex
CREATE INDEX "group_responsibilities_userId_role_activeUntil_idx" ON "group_responsibilities"("userId", "role", "activeUntil");

-- CreateIndex
CREATE UNIQUE INDEX "group_responsibilities_groupId_userId_role_activeFrom_key" ON "group_responsibilities"("groupId", "userId", "role", "activeFrom");

-- CreateIndex
CREATE INDEX "group_memberships_personId_idx" ON "group_memberships"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_groupId_personId_key" ON "group_memberships"("groupId", "personId");

-- CreateIndex
CREATE INDEX "events_churchId_startsAt_idx" ON "events"("churchId", "startsAt");

-- CreateIndex
CREATE INDEX "events_churchId_type_startsAt_idx" ON "events"("churchId", "type", "startsAt");

-- CreateIndex
CREATE INDEX "events_groupId_startsAt_idx" ON "events"("groupId", "startsAt");

-- CreateIndex
CREATE INDEX "events_groupId_type_startsAt_idx" ON "events"("groupId", "type", "startsAt");

-- CreateIndex
CREATE INDEX "events_groupId_scheduleStartsAt_idx" ON "events"("groupId", "scheduleStartsAt");

-- CreateIndex
CREATE INDEX "events_groupId_type_scheduleStartsAt_idx" ON "events"("groupId", "type", "scheduleStartsAt");

-- CreateIndex
CREATE UNIQUE INDEX "events_groupId_startsAt_type_key" ON "events"("groupId", "startsAt", "type");

-- CreateIndex
CREATE UNIQUE INDEX "events_groupId_scheduleStartsAt_type_key" ON "events"("groupId", "scheduleStartsAt", "type");

-- CreateIndex
CREATE INDEX "attendances_personId_markedAt_idx" ON "attendances"("personId", "markedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_eventId_personId_key" ON "attendances"("eventId", "personId");

-- CreateIndex
CREATE INDEX "care_signals_churchId_status_severity_idx" ON "care_signals"("churchId", "status", "severity");

-- CreateIndex
CREATE INDEX "care_signals_personId_status_idx" ON "care_signals"("personId", "status");

-- CreateIndex
CREATE INDEX "care_signals_groupId_status_idx" ON "care_signals"("groupId", "status");

-- CreateIndex
CREATE INDEX "care_signals_groupId_source_status_personId_resolvedAt_idx" ON "care_signals"("groupId", "source", "status", "personId", "resolvedAt");

-- CreateIndex
CREATE INDEX "care_touches_churchId_happenedAt_idx" ON "care_touches"("churchId", "happenedAt");

-- CreateIndex
CREATE INDEX "care_touches_personId_happenedAt_idx" ON "care_touches"("personId", "happenedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_responsibilities" ADD CONSTRAINT "group_responsibilities_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_responsibilities" ADD CONSTRAINT "group_responsibilities_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_responsibilities" ADD CONSTRAINT "group_responsibilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_signals" ADD CONSTRAINT "care_signals_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_signals" ADD CONSTRAINT "care_signals_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_signals" ADD CONSTRAINT "care_signals_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_signals" ADD CONSTRAINT "care_signals_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_touches" ADD CONSTRAINT "care_touches_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_touches" ADD CONSTRAINT "care_touches_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_touches" ADD CONSTRAINT "care_touches_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_touches" ADD CONSTRAINT "care_touches_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
