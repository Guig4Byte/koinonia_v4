import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "@playwright/test";
import {
  AttendanceStatus,
  EventStatus,
  GroupKind,
  GroupResponsibilityRole,
  MembershipRole,
} from "../../src/generated/prisma/client";
import { e2ePrisma } from "./support/db";

type ThemeId = "light" | "dark" | "parchment";
type ThemeDir = "claro" | "escuro" | "pergaminho";
type ProfileId = "publico" | "lider" | "supervisor" | "pastor";

type ScreenDefinition = {
  slug: string;
  path: (targets: CaptureTargets) => string;
  isFormOrCheckIn?: boolean;
};

type CaptureTargets = {
  groupId: string;
  personId: string;
  eventId: string;
};

type BottomNavNote = {
  theme: ThemeDir;
  profile: Exclude<ProfileId, "publico">;
  screen: string;
  kind: "formulario" | "check-in";
  navVisibleAtTop: boolean;
  navVisibleAtBottom: boolean;
};

const THEMES: Array<{ id: ThemeId; dir: ThemeDir }> = [
  { id: "light", dir: "claro" },
  { id: "dark", dir: "escuro" },
  { id: "parchment", dir: "pergaminho" },
];

const PROFILE_LOGIN = {
  lider: { email: "bruno@koinonia.local", password: "koinonia123", home: "/lider" },
  supervisor: { email: "ana@koinonia.local", password: "koinonia123", home: "/supervisor" },
  pastor: { email: "pastor@koinonia.local", password: "koinonia123", home: "/pastor" },
} as const;

const PROFILE_SCREENS: Record<Exclude<ProfileId, "publico">, ScreenDefinition[]> = {
  lider: [
    { slug: "lider", path: () => "/lider" },
    { slug: "celula", path: () => "/celulas" },
    { slug: "detalhe-celula", path: ({ groupId }) => `/celulas/${groupId}` },
    { slug: "pessoas", path: () => "/pessoas" },
    { slug: "detalhe-pessoa", path: ({ personId }) => `/pessoas/${personId}` },
    { slug: "encontros", path: () => "/eventos" },
    { slug: "encontros-sem-presenca", path: () => "/eventos?consulta=sem-presenca&periodo=30d" },
    { slug: "historico-presenca", path: () => "/eventos?consulta=historico&periodo=30d" },
    { slug: "resumo-encontro", path: ({ eventId }) => `/eventos/${eventId}` },
    { slug: "detalhe-encontro", path: ({ eventId }) => `/eventos/${eventId}?modo=ajuste`, isFormOrCheckIn: true },
  ],
  supervisor: [
    { slug: "supervisor", path: () => "/supervisor" },
    { slug: "celulas", path: () => "/celulas" },
    { slug: "pessoas", path: () => "/pessoas" },
    { slug: "detalhe-pessoa", path: ({ personId }) => `/pessoas/${personId}` },
    { slug: "detalhe-celula", path: ({ groupId }) => `/celulas/${groupId}` },
    { slug: "encontros", path: () => "/eventos" },
    { slug: "encontros-sem-presenca", path: () => "/eventos?consulta=sem-presenca&periodo=30d" },
    { slug: "historico-presenca", path: () => "/eventos?consulta=historico&periodo=30d" },
    { slug: "resumo-encontro", path: ({ eventId }) => `/eventos/${eventId}` },
    { slug: "detalhe-encontro", path: ({ eventId }) => `/eventos/${eventId}?modo=ajuste`, isFormOrCheckIn: true },
  ],
  pastor: [
    { slug: "pastor", path: () => "/pastor" },
    { slug: "equipe", path: () => "/equipe" },
    { slug: "pessoas", path: () => "/pessoas" },
    { slug: "detalhe-pessoa", path: ({ personId }) => `/pessoas/${personId}` },
    { slug: "detalhe-celula", path: ({ groupId }) => `/celulas/${groupId}` },
    { slug: "nova-celula", path: () => "/celulas/nova", isFormOrCheckIn: true },
    { slug: "editar-celula", path: ({ groupId }) => `/celulas/${groupId}/editar`, isFormOrCheckIn: true },
    { slug: "encontros", path: () => "/eventos" },
    { slug: "encontros-sem-presenca", path: () => "/eventos?consulta=sem-presenca&periodo=30d" },
    { slug: "historico-presenca", path: () => "/eventos?consulta=historico&periodo=30d" },
    { slug: "resumo-encontro", path: ({ eventId }) => `/eventos/${eventId}` },
    { slug: "detalhe-encontro", path: ({ eventId }) => `/eventos/${eventId}?modo=ajuste`, isFormOrCheckIn: true },
  ],
};

const OUTPUT_ROOT = path.join(process.cwd(), "artifacts", "mobile-captures");
const BOTTOM_NAV_SELECTOR = "main.safe-page > nav";

let cachedTargets: CaptureTargets | null = null;

async function resolveTargets(): Promise<CaptureTargets> {
  if (cachedTargets) return cachedTargets;

  const [leader, supervisor] = await Promise.all([
    e2ePrisma.user.findUnique({
      where: { email: PROFILE_LOGIN.lider.email },
      select: { id: true, churchId: true },
    }),
    e2ePrisma.user.findUnique({
      where: { email: PROFILE_LOGIN.supervisor.email },
      select: { id: true, churchId: true },
    }),
  ]);

  if (!leader) {
    throw new Error(`Usuario ${PROFILE_LOGIN.lider.email} nao encontrado. Rode npm run db:seed antes de capturar.`);
  }

  if (!supervisor) {
    throw new Error(`Usuario ${PROFILE_LOGIN.supervisor.email} nao encontrado. Rode npm run db:seed antes de capturar.`);
  }

  const group = await e2ePrisma.smallGroup.findFirst({
    where: {
      churchId: leader.churchId,
      kind: GroupKind.CELL,
      isActive: true,
      responsibilities: {
        some: {
          activeUntil: null,
          role: GroupResponsibilityRole.LEADER,
          userId: leader.id,
        },
      },
      AND: [
        {
          responsibilities: {
            some: {
              activeUntil: null,
              role: GroupResponsibilityRole.SUPERVISOR,
              userId: supervisor.id,
            },
          },
        },
      ],
      events: {
        some: {
          status: EventStatus.COMPLETED,
          startsAt: { lte: new Date() },
          attendances: {
            some: {
              status: {
                in: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.JUSTIFIED],
              },
            },
          },
        },
      },
    },
    select: { id: true },
  });

  if (!group) {
    throw new Error("Nenhuma celula ativa compartilhada entre lider e supervisor foi encontrada na seed.");
  }

  const person = await e2ePrisma.person.findFirst({
    where: {
      churchId: leader.churchId,
      memberships: {
        some: {
          groupId: group.id,
          leftAt: null,
          role: { not: MembershipRole.VISITOR },
        },
      },
    },
    orderBy: { fullName: "asc" },
    select: { id: true },
  });

  if (!person) {
    throw new Error("Nenhuma pessoa ativa foi encontrada para a celula alvo.");
  }

  const event = await e2ePrisma.event.findFirst({
    where: {
      churchId: leader.churchId,
      groupId: group.id,
      status: EventStatus.COMPLETED,
      startsAt: { lte: new Date() },
      attendances: {
        some: {
          status: {
            in: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.JUSTIFIED],
          },
        },
      },
    },
    orderBy: { startsAt: "desc" },
    select: { id: true },
  });

  if (!event) {
    throw new Error("Nenhum encontro concluido com presenca registrada foi encontrado para a celula alvo.");
  }

  cachedTargets = {
    groupId: group.id,
    personId: person.id,
    eventId: event.id,
  };

  return cachedTargets;
}

async function ensureTheme(context: import("@playwright/test").BrowserContext, theme: ThemeId) {
  await context.addInitScript((selectedTheme: ThemeId) => {
    window.localStorage.setItem("koinonia-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
    document.documentElement.style.colorScheme = selectedTheme === "dark" ? "dark" : "light";
  }, theme);
}

async function disableAnimations(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
}

async function waitForStablePage(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForFunction(() => {
    const hasBusy = Boolean(document.querySelector('[aria-busy="true"]'));
    const hasSkeleton = Boolean(document.querySelector(".animate-pulse"));
    return !hasBusy && !hasSkeleton;
  }, undefined, { timeout: 15000 });
  await page.waitForTimeout(200);
}

async function removeTemporaryOverlays(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const selectors = [
      "[data-radix-portal]",
      "[data-headlessui-portal]",
      ".react-joyride__overlay",
    ];

    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        element.remove();
      }
    }
  });
}

async function isBottomNavVisible(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const nav = document.querySelector("main.safe-page > nav") as HTMLElement | null;
    if (!nav) return false;

    const style = window.getComputedStyle(nav);
    const rect = nav.getBoundingClientRect();

    return style.display !== "none"
      && style.visibility !== "hidden"
      && style.opacity !== "0"
      && rect.width > 0
      && rect.height > 0;
  });
}

async function hideBottomNavForFullPage(page: import("@playwright/test").Page) {
  await page.evaluate((selector) => {
    const styleId = "koinonia-hide-bottom-nav-for-capture";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `${selector} { display: none !important; }`;
    document.head.append(style);
  }, BOTTOM_NAV_SELECTOR);
}

async function saveScreenshot({
  page,
  filePath,
  fullPage = false,
}: {
  page: import("@playwright/test").Page;
  filePath: string;
  fullPage?: boolean;
}) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, fullPage });
}

async function captureScreen({
  page,
  themeDir,
  profile,
  screen,
  screenIndex,
  targets,
  notes,
}: {
  page: import("@playwright/test").Page;
  themeDir: ThemeDir;
  profile: Exclude<ProfileId, "publico">;
  screen: ScreenDefinition;
  screenIndex: number;
  targets: CaptureTargets;
  notes: BottomNavNote[];
}) {
  const number = String(screenIndex).padStart(2, "0");
  const urlPath = screen.path(targets);
  await page.goto(urlPath, { waitUntil: "domcontentloaded" });
  await disableAnimations(page);
  await waitForStablePage(page);
  await removeTemporaryOverlays(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);

  const topNavVisible = await isBottomNavVisible(page);
  await saveScreenshot({
    page,
    filePath: path.join(OUTPUT_ROOT, themeDir, profile, "viewport-com-nav", `${number}-${screen.slug}.png`),
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(220);
  await removeTemporaryOverlays(page);
  const bottomNavVisible = await isBottomNavVisible(page);
  await saveScreenshot({
    page,
    filePath: path.join(OUTPUT_ROOT, themeDir, profile, "bottom-com-nav", `${number}-${screen.slug}.png`),
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(140);
  await hideBottomNavForFullPage(page);
  await saveScreenshot({
    page,
    filePath: path.join(OUTPUT_ROOT, themeDir, profile, "fullpage-sem-nav", `${number}-${screen.slug}.png`),
    fullPage: true,
  });

  if (screen.isFormOrCheckIn) {
    const hasCheckInSubmit = (await page.getByRole("button", { name: /Salvar (ajuste|presen)/i }).count()) > 0;
    const isCheckIn = screen.slug === "detalhe-encontro" && hasCheckInSubmit;
    notes.push({
      theme: themeDir,
      profile,
      screen: screen.slug,
      kind: isCheckIn ? "check-in" : "formulario",
      navVisibleAtTop: topNavVisible,
      navVisibleAtBottom: bottomNavVisible,
    });
  }
}

async function captureLoginPublic({
  page,
  themeDir,
}: {
  page: import("@playwright/test").Page;
  themeDir: ThemeDir;
}) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await disableAnimations(page);
  await waitForStablePage(page);
  await removeTemporaryOverlays(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);

  const fileName = "01-login.png";
  await saveScreenshot({
    page,
    filePath: path.join(OUTPUT_ROOT, themeDir, "publico", "viewport-com-nav", fileName),
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(220);
  await saveScreenshot({
    page,
    filePath: path.join(OUTPUT_ROOT, themeDir, "publico", "bottom-com-nav", fileName),
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(140);
  await hideBottomNavForFullPage(page);
  await saveScreenshot({
    page,
    filePath: path.join(OUTPUT_ROOT, themeDir, "publico", "fullpage-sem-nav", fileName),
    fullPage: true,
  });
}

async function loginAsProfile(page: import("@playwright/test").Page, profile: Exclude<ProfileId, "publico">) {
  const credentials = PROFILE_LOGIN[profile];
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await disableAnimations(page);
  await waitForStablePage(page);
  await page.getByLabel(/e-mail/i).fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(new RegExp(`${credentials.home}(\\?|$)`));
  await waitForStablePage(page);
}

async function writeBottomNavReport(notes: BottomNavNote[]) {
  const header = [
    "# Relatorio de bottom nav em telas de formulario/check-in",
    "",
    "- `aparece` = bottom nav visivel.",
    "- `nao aparece` = bottom nav oculto na tela.",
    "",
  ];

  const lines = notes
    .sort((a, b) => `${a.theme}/${a.profile}/${a.screen}`.localeCompare(`${b.theme}/${b.profile}/${b.screen}`))
    .map((note) => {
      const top = note.navVisibleAtTop ? "aparece" : "nao aparece";
      const bottom = note.navVisibleAtBottom ? "aparece" : "nao aparece";
      return `- ${note.theme}/${note.profile}/${note.screen} (${note.kind}): topo=${top}; fim=${bottom}`;
    });

  await writeFile(path.join(OUTPUT_ROOT, "bottom-nav-report.md"), [...header, ...lines, ""].join("\n"), "utf8");
}

test.describe("mobile screenshots matrix", () => {
  test.setTimeout(45 * 60 * 1000);

  test("generates screenshots for themes, profiles and capture types", async ({ browser }, testInfo) => {
    await rm(OUTPUT_ROOT, { recursive: true, force: true });
    await mkdir(OUTPUT_ROOT, { recursive: true });

    const targets = await resolveTargets();
    const bottomNavNotes: BottomNavNote[] = [];
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");

    for (const theme of THEMES) {
      {
        const publicContext = await browser.newContext({
          baseURL,
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 1,
          isMobile: true,
          hasTouch: true,
        });
        await ensureTheme(publicContext, theme.id);
        const publicPage = await publicContext.newPage();
        await captureLoginPublic({ page: publicPage, themeDir: theme.dir });
        await publicContext.close();
      }

      for (const profile of ["lider", "supervisor", "pastor"] as const) {
        const context = await browser.newContext({
          baseURL,
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 1,
          isMobile: true,
          hasTouch: true,
        });
        await ensureTheme(context, theme.id);
        const page = await context.newPage();
        await loginAsProfile(page, profile);

        const screens = PROFILE_SCREENS[profile];
        for (let index = 0; index < screens.length; index += 1) {
          await captureScreen({
            page,
            themeDir: theme.dir,
            profile,
            screen: screens[index],
            screenIndex: index + 1,
            targets,
            notes: bottomNavNotes,
          });
        }

        await context.close();
      }
    }

    await writeBottomNavReport(bottomNavNotes);
    await e2ePrisma.$disconnect();
  });
});
