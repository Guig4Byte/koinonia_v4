#!/usr/bin/env node
//eslint-env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const COMPONENT_NAMES = [
  "ActionPill",
  "ButtonLink",
  "Button",
  "Badge",
  "CardLink",
  "Card",
  "Field",
  "InputField",
  "SelectField",
  "TextareaField",
  "DisclosureCard",
  "BottomSheet",
  "FilterChip",
  "SummaryCard",
  "StatusCard",
  "PresenceMetricDisplay",
  "PresenceIndicator",
];

const EXCLUDED_DIR_NAMES = new Set([".git", ".next", "build", "coverage", "node_modules", "out"]);
const EXCLUDED_PATH_PARTS = new Set(["src/generated"]);
const SCANNED_EXTENSIONS = new Set([".css", ".ts", ".tsx"]);
const DEFAULT_MAX_FINDINGS = 120;

const severityWeight = {
  alta: 0,
  média: 1,
  baixa: 2,
};

const componentRules = {
  ActionPill: [
    {
      id: "action-pill-local-geometry",
      severity: "baixa",
      pattern:
        /\b(?:h|min-h|max-h|px|py|p|pl|pr|pt|pb)-|\brounded-|\btext-\[|\btext-(?:xs|sm|base|lg)\b|\bjustify-(?:between|start|end)\b|\bmin-w-/,
      message: "ActionPill recebeu override local de geometria, densidade ou tipografia.",
      recommendation: "Promova o padrão para props oficiais como tone, size, minWidth ou iconPosition.",
    },
  ],
  Button: [
    {
      id: "button-local-geometry",
      severity: "média",
      pattern:
        /\b(?:h|min-h|max-h|px|py|p|pl|pr|pt|pb)-|\brounded-|\btext-\[|\btext-(?:xs|sm|base|lg)\b|\bjustify-(?:between|start|end)\b|\btext-left\b|\bw-full\b/,
      message: "Button recebeu override local de geometria, densidade, alinhamento ou tipografia.",
      recommendation:
        "Promova o padrão para props oficiais como shape, density, align, iconOnly ou responsiveWidth.",
    },
  ],
  ButtonLink: [
    {
      id: "button-link-local-geometry",
      severity: "média",
      pattern:
        /\b(?:h|min-h|max-h|px|py|p|pl|pr|pt|pb)-|\brounded-|\btext-\[|\btext-(?:xs|sm|base|lg)\b|\bjustify-(?:between|start|end)\b|\btext-left\b|\bw-full\b/,
      message: "ButtonLink recebeu override local de geometria, densidade, alinhamento ou tipografia.",
      recommendation:
        "Reaproveite as mesmas props oficiais do Button para evitar classes soltas em links-botão.",
    },
  ],
  Badge: [
    {
      id: "badge-local-shape-density",
      severity: "média",
      pattern: /\bmax-w-\[|\b(?:px|py|p|pl|pr)-|\brounded-|\btext-\[|\btext-(?:xs|sm)\b|\btruncate\b/,
      message: "Badge recebeu override local de largura, shape, densidade ou tipografia.",
      recommendation: "Crie props como size, maxWidth, shape e truncate no Badge base.",
    },
  ],
  Card: [
    {
      id: "card-local-surface",
      severity: "média",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\bshadow-|\brounded-|\bp[trblxy]?-(?:\[|\d)|\bmin-h-|\boverflow-hidden\b/,
      message: "Card recebeu override local de superfície, espaçamento ou contenção visual.",
      recommendation:
        "Crie variantes oficiais de Card para radius, density, elevation, statusTone ou accent. Deixe CSS de feature apenas para layout interno.",
    },
  ],
  CardLink: [
    {
      id: "card-link-local-surface",
      severity: "alta",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\bshadow-|\brounded-|\bp[trblxy]?-(?:\[|\d)|\bmin-h-|\boverflow-hidden\b|\brelative\b/,
      message: "CardLink recebeu override local de superfície, espaçamento ou estado visual.",
      recommendation:
        "Promova o padrão para variantes de CardLink/priority card. Evite redefinir superfície em CSS Module ou className local.",
    },
  ],
  Field: [
    {
      id: "field-local-control-style",
      severity: "baixa",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\brounded-|\b(?:px|py|p)-|\btext-\[/,
      message: "Field recebeu classes que parecem pertencer a um controle de formulário.",
      recommendation: "Use InputField, SelectField, TextareaField ou FieldError para centralizar controle, foco, erro e required.",
    },
  ],
  InputField: [
    {
      id: "input-field-local-control-style",
      severity: "baixa",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\brounded-|\b(?:h|min-h|px|py|p)-|\btext-\[/,
      message: "InputField recebeu override local de controle de formulário.",
      recommendation: "Promova o padrão para props como size, error, required ou para a primitive de formulário base.",
    },
  ],
  SelectField: [
    {
      id: "select-field-local-control-style",
      severity: "baixa",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\brounded-|\b(?:h|min-h|px|py|p)-|\btext-\[/,
      message: "SelectField recebeu override local de controle de formulário.",
      recommendation: "Promova o padrão para props como size, error, required, icon ou para a primitive de formulário base.",
    },
  ],
  TextareaField: [
    {
      id: "textarea-field-local-control-style",
      severity: "baixa",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\brounded-|\b(?:h|min-h|px|py|p)-|\btext-\[/,
      message: "TextareaField recebeu override local de controle de formulário.",
      recommendation: "Promova o padrão para props como size, error, required, resize ou para a primitive de formulário base.",
    },
  ],
  DisclosureCard: [
    {
      id: "disclosure-card-local-surface",
      severity: "baixa",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\bshadow-|\brounded-|\bp[trblxy]?-(?:\[|\d)|\bmin-h-|\boverflow-hidden\b|\bfocus-visible:/,
      message: "DisclosureCard recebeu override local de superfície, espaçamento ou foco.",
      recommendation: "Promova o padrão para props como tone, size, layout, separatedContent ou action.",
    },
  ],
  BottomSheet: [
    {
      id: "bottom-sheet-local-stack",
      severity: "baixa",
      pattern: /\b(?:fixed|absolute|z-|inset-|bottom-|top-)\b|\bbg-\[|\bshadow-|\brounded-|\bp[trblxy]?-(?:\[|\d)/,
      message: "BottomSheet recebeu override local de camada, superfície ou espaçamento.",
      recommendation: "Promova variações de sheet para props como size, tone, showHandle ou para tokens de z-index/safe-area.",
    },
  ],
  FilterChip: [
    {
      id: "filter-chip-local-state-style",
      severity: "baixa",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\brounded-|\b(?:px|py|p)-|\bfocus-visible:/,
      message: "FilterChip recebeu estilo local de estado, forma ou densidade.",
      recommendation: "Centralize estados selected/focus/size/variant no FilterChip base.",
    },
  ],
  SummaryCard: [
    {
      id: "summary-card-local-surface",
      severity: "média",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\bshadow-|\brounded-|\bp[trblxy]?-(?:\[|\d)|\bmin-h-/,
      message: "SummaryCard recebeu override local de superfície ou densidade.",
      recommendation: "Adicione variantes de SummaryCard ou primitives de métrica em vez de ajustar a superfície localmente.",
    },
  ],
  StatusCard: [
    {
      id: "status-card-local-surface",
      severity: "média",
      pattern: /\bborder(?:-|\b)|\bbg-\[|\bshadow-|\brounded-|\bp[trblxy]?-(?:\[|\d)|\bmin-h-|\boverflow-hidden\b/,
      message: "StatusCard recebeu override local de superfície ou densidade.",
      recommendation: "Promova tom, padding, radius ou containment para props oficiais do StatusCard.",
    },
  ],
  PresenceIndicator: [
    {
      id: "presence-indicator-local-size",
      severity: "alta",
      pattern: /\b(?:h|w|min-h|min-w|max-h|max-w)-/,
      message: "PresenceIndicator recebeu override local de tamanho.",
      recommendation: "Adicione tamanhos oficiais como xs, xl ou compact no componente base.",
    },
  ],
  PresenceMetricDisplay: [
    {
      id: "presence-metric-local-layout",
      severity: "baixa",
      pattern: /\btext-\[|\bgap-|\bgrid\b|\bitems-|\bjustify-|\bmin-w-/,
      message: "PresenceMetricDisplay recebeu override local de layout ou tipografia.",
      recommendation: "Considere props layout, density ou valueSize, ou uma primitive PresenceSpotlight.",
    },
  ],
};

const jsxLocalCssModuleRule = {
  id: "base-component-with-css-module-class",
  severity: "média",
  pattern: /className\s*=\s*{[^}]*\bstyles\.|className\s*=\s*{\s*cn\([^)]*\bstyles\./s,
  message: "Componente base recebeu className vindo de CSS Module local.",
  recommendation:
    "Verifique se o CSS Module está cuidando só de layout interno. Superfície, tamanho, foco e tom devem virar variante do componente base.",
};

const arbitraryUtilityRule = {
  id: "arbitrary-tailwind-visual-override",
  severity: "baixa",
  pattern:
    /\b(?:text|h|min-h|max-h|w|min-w|max-w|rounded|bg|border|shadow|p|px|py|pl|pr|pt|pb)-\[[^\]]+\]/,
  message: "Classe Tailwind arbitrária usada em className pode indicar variante visual ausente.",
  recommendation:
    "Se o valor se repetir ou corrigir componente base, transforme em token, variante oficial ou primitive reutilizável.",
};

const LOW_DISPOSITION = {
  ACCEPTED: "aceitável",
  CANDIDATE: "candidato",
  REVIEW: "revisar",
};

const LOW_CATEGORY_DETAILS = {
  "tokens/typography-color": {
    label: "Tokens de tipografia/cor em composição local",
    recommendation: "Aceite quando a classe apenas aplica token de texto/cor em layout local. Promova para primitive se o bloco inteiro se repetir.",
  },
  "layout/skeleton-loading": {
    label: "Skeleton/loading state",
    recommendation: "Aceite enquanto o padrão estiver limitado a loading states. Extraia apenas se vários skeletons passarem a compartilhar a mesma estrutura.",
  },
  "system/primitive-internal": {
    label: "Implementação interna de primitive/layout",
    recommendation: "Aceite quando o arquivo é a própria primitive ou componente de layout global. A auditoria deve vigiar consumidores, não impedir a implementação do padrão base.",
  },
  "layout/text-measure": {
    label: "Medida textual ou quebra defensiva",
    recommendation: "Aceite para max-width, leading/tracking e truncamento pontual. Revise se virar padrão de heading/section.",
  },
  "candidate/local-surface": {
    label: "Candidato: superfície local",
    recommendation: "Revise se o bloco cria card, callout, alerta ou superfície recorrente. Pode virar Card, StatusCard, ActionPanel ou primitive específica.",
  },
  "candidate/control-or-action": {
    label: "Candidato: controle/ação local",
    recommendation: "Revise se o bloco simula botão, input, select, action pill ou badge. Prefira Button, InputField, SelectField, ActionPill ou Badge.",
  },
  "candidate/size-or-density": {
    label: "Candidato: tamanho/densidade arbitrária",
    recommendation: "Revise se o tamanho corrige primitive ou se repete. Prefira props de size, density, minWidth ou maxWidth.",
  },
  "review/login-contained": {
    label: "Revisar: visual isolado de login",
    recommendation: "Login pode ter composição própria, mas campos, alertas e cards recorrentes devem migrar para primitives quando deixarem de ser exclusivos.",
  },
  "review/generic-arbitrary": {
    label: "Revisar: utilitário arbitrário genérico",
    recommendation: "Verifique se é caso único. Se repetir ou corrigir componente base, crie token, prop oficial ou primitive.",
  },
};

const nativeDisclosureRule = {
  id: "native-disclosure-local-style",
  severity: "média",
  message: "Uso local de <details>/<summary> para disclosure/accordion.",
  recommendation: "Use DisclosureCard para centralizar superfície, foco, labels de aberto/fechado e espaçamento.",
};

function parseArgs(argv) {
  const options = {
    dirs: [],
    help: false,
    json: false,
    maxFindings: DEFAULT_MAX_FINDINGS,
    root: process.cwd(),
    failOnLow: false,
    lowReview: false,
    strict: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    if (arg === "--fail-on-low") {
      options.failOnLow = true;
      continue;
    }

    if (arg === "--low-review") {
      options.lowReview = true;
      continue;
    }

    if (arg.startsWith("--root=")) {
      options.root = path.resolve(arg.slice("--root=".length));
      continue;
    }

    if (arg.startsWith("--dir=")) {
      options.dirs.push(arg.slice("--dir=".length));
      continue;
    }

    if (arg.startsWith("--max-findings=")) {
      const rawValue = arg.slice("--max-findings=".length);
      const parsedValue = Number.parseInt(rawValue, 10);

      if (!Number.isNaN(parsedValue) && parsedValue >= 0) {
        options.maxFindings = parsedValue;
      }
    }
  }

  if (options.dirs.length === 0) {
    options.dirs = ["src"];
  }

  return options;
}

function printHelp() {
  console.log(`Auditoria UI/CSS de overrides locais

Uso:
  npm run audit:ui-css
  npm run audit:ui-css -- --strict
  npm run audit:ui-css -- --low-review
  npm run audit:ui-css -- --json

Opções:
  --dir=<caminho>          Diretório para varrer. Pode ser usado múltiplas vezes. Padrão: src
  --json                   Imprime findings em JSON.
  --low-review             Imprime uma revisão agrupada apenas dos achados baixos.
  --max-findings=<n>       Limita a saída textual. Use 0 para não limitar. Padrão: ${DEFAULT_MAX_FINDINGS}
  --root=<caminho>         Raiz do projeto. Padrão: diretório atual.
  --strict                 Encerra com código 1 quando houver achado alto ou médio.
  --fail-on-low            Faz --strict também falhar com achados baixos.

Comentários de exceção:
  // ui-audit-ignore-next-line
  // ui-audit-ignore-line
  /* ui-audit-ignore-file */`);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isPathExcluded(relativePath) {
  const normalizedPath = toPosixPath(relativePath);
  return [...EXCLUDED_PATH_PARTS].some((part) => normalizedPath.includes(part));
}

function collectFiles(root, dirs) {
  const files = [];

  for (const dir of dirs) {
    const absoluteDir = path.resolve(root, dir);

    if (!existsSync(absoluteDir)) {
      continue;
    }

    walk(absoluteDir, files, root);
  }

  return files;
}

function walk(currentPath, files, root) {
  const currentStat = statSync(currentPath);

  if (currentStat.isDirectory()) {
    const directoryName = path.basename(currentPath);
    const relativePath = path.relative(root, currentPath);

    if (EXCLUDED_DIR_NAMES.has(directoryName) || isPathExcluded(relativePath)) {
      return;
    }

    for (const entry of readdirSync(currentPath)) {
      walk(path.join(currentPath, entry), files, root);
    }

    return;
  }

  if (!currentStat.isFile()) {
    return;
  }

  const extension = path.extname(currentPath);

  if (SCANNED_EXTENSIONS.has(extension)) {
    files.push(currentPath);
  }
}

function buildLineStarts(content) {
  const starts = [0];

  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      starts.push(index + 1);
    }
  }

  return starts;
}

function lineNumberFromIndex(lineStarts, index) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (lineStarts[mid] <= index) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return high + 1;
}

function hasIgnoreFile(content) {
  return content.includes("ui-audit-ignore-file");
}

function isIgnoredAtLine(lines, oneBasedLineNumber) {
  const lineIndex = oneBasedLineNumber - 1;
  const currentLine = lines[lineIndex] ?? "";
  const previousLine = lines[lineIndex - 1] ?? "";

  return currentLine.includes("ui-audit-ignore-line") || previousLine.includes("ui-audit-ignore-next-line");
}

function findOpeningTagEnd(content, startIndex) {
  let quote = null;
  let braceDepth = 0;

  for (let index = startIndex; index < content.length; index += 1) {
    const char = content[index];
    const previousChar = content[index - 1];

    if (quote) {
      if (char === quote && previousChar !== "\\") {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}" && braceDepth > 0) {
      braceDepth -= 1;
      continue;
    }

    if (char === ">" && braceDepth === 0) {
      return index + 1;
    }
  }

  return -1;
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractClassNameAttributeText(tagText) {
  const classNameIndex = tagText.indexOf("className");

  if (classNameIndex === -1) {
    return "";
  }

  const equalsIndex = tagText.indexOf("=", classNameIndex);

  if (equalsIndex === -1) {
    return "";
  }

  let valueStartIndex = equalsIndex + 1;

  while (/\s/.test(tagText[valueStartIndex] ?? "")) {
    valueStartIndex += 1;
  }

  const startChar = tagText[valueStartIndex];

  if (startChar === '"' || startChar === "'") {
    const endIndex = tagText.indexOf(startChar, valueStartIndex + 1);
    return endIndex === -1 ? tagText.slice(valueStartIndex + 1) : tagText.slice(valueStartIndex + 1, endIndex);
  }

  if (startChar !== "{") {
    return "";
  }

  let quote = null;
  let braceDepth = 0;

  for (let index = valueStartIndex; index < tagText.length; index += 1) {
    const char = tagText[index];
    const previousChar = tagText[index - 1];

    if (quote) {
      if (char === quote && previousChar !== "\\") {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}") {
      braceDepth -= 1;

      if (braceDepth === 0) {
        return tagText.slice(valueStartIndex + 1, index);
      }
    }
  }

  return tagText.slice(valueStartIndex + 1);
}

function createFinding({
  component,
  disposition,
  file,
  line,
  lowCategory,
  message,
  recommendation,
  ruleId,
  severity,
  snippet,
}) {
  return {
    component,
    disposition: severity === "baixa" ? (disposition ?? LOW_DISPOSITION.CANDIDATE) : undefined,
    file,
    line,
    lowCategory: severity === "baixa" ? (lowCategory ?? "review/generic-arbitrary") : undefined,
    message,
    recommendation,
    ruleId,
    severity,
    snippet: collapseWhitespace(snippet).slice(0, 240),
  };
}

function classifyArbitraryUtilityLine({ lineContent, relativePath }) {
  const normalizedLine = collapseWhitespace(lineContent);
  const isLoginFile = relativePath.startsWith("src/app/login/");
  const isPrimitiveOrLayoutFile = relativePath.startsWith("src/components/ui/") || relativePath.startsWith("src/components/layout/");
  const isSkeletonFile = relativePath.includes("/loading-skeletons/");
  const hasSurfaceUtility =
    /\b(?:rounded|bg|border|shadow)-\[[^\]]+\]/.test(normalizedLine) ||
    /\bborder-\[var\(--/.test(normalizedLine) ||
    /\bbg-\[var\(--/.test(normalizedLine);
  const hasControlOrActionSignal =
    /\b(?:input|select|textarea|button|action|badge|pill|alert|card)\b/i.test(normalizedLine) ||
    /(?:login-form-controls|event-close-action|event-reschedule-action|event-location-action)/.test(relativePath);
  const hasArbitrarySizeOrDensity =
    /\b(?:h|min-h|max-h|w|min-w|max-w|p|px|py|pl|pr|pt|pb)-\[[^\]]+\]/.test(normalizedLine);
  const hasOnlyTokenTypographyOrColor =
    /(?:text-\[(?:length|color):var\(--|leading-\[[^\]]+\]|tracking-\[[^\]]+\])/.test(normalizedLine) &&
    !hasSurfaceUtility &&
    !hasArbitrarySizeOrDensity;
  const hasTextMeasure =
    /\bmax-w-\[[^\]]+\]/.test(normalizedLine) || /(?:leading|tracking)-\[[^\]]+\]/.test(normalizedLine);

  if (isSkeletonFile) {
    return {
      disposition: LOW_DISPOSITION.ACCEPTED,
      lowCategory: "layout/skeleton-loading",
    };
  }

  if (isPrimitiveOrLayoutFile) {
    return {
      disposition: LOW_DISPOSITION.ACCEPTED,
      lowCategory: "system/primitive-internal",
    };
  }

  if (isLoginFile) {
    return {
      disposition: LOW_DISPOSITION.REVIEW,
      lowCategory: "review/login-contained",
    };
  }

  if (hasSurfaceUtility) {
    return {
      disposition: LOW_DISPOSITION.CANDIDATE,
      lowCategory: "candidate/local-surface",
    };
  }

  if (hasControlOrActionSignal) {
    return {
      disposition: LOW_DISPOSITION.CANDIDATE,
      lowCategory: "candidate/control-or-action",
    };
  }

  if (hasArbitrarySizeOrDensity) {
    return {
      disposition: LOW_DISPOSITION.CANDIDATE,
      lowCategory: "candidate/size-or-density",
    };
  }

  if (hasOnlyTokenTypographyOrColor) {
    return {
      disposition: LOW_DISPOSITION.ACCEPTED,
      lowCategory: "tokens/typography-color",
    };
  }

  if (hasTextMeasure) {
    return {
      disposition: LOW_DISPOSITION.ACCEPTED,
      lowCategory: "layout/text-measure",
    };
  }

  return {
    disposition: LOW_DISPOSITION.REVIEW,
    lowCategory: "review/generic-arbitrary",
  };
}

function scanJsxFile({ content, lines, lineStarts, relativePath }) {
  const findings = [];
  const componentPattern = new RegExp(`<\\s*(${COMPONENT_NAMES.join("|")})\\b`, "g");
  let match;

  while ((match = componentPattern.exec(content)) !== null) {
    const component = match[1];
    const startIndex = match.index;
    const endIndex = findOpeningTagEnd(content, startIndex);

    if (endIndex === -1) {
      continue;
    }

    const tagText = content.slice(startIndex, endIndex);
    const line = lineNumberFromIndex(lineStarts, startIndex);

    const classNameText = extractClassNameAttributeText(tagText);

    if (!classNameText || isIgnoredAtLine(lines, line)) {
      continue;
    }

    const rules = componentRules[component] ?? [];

    for (const rule of rules) {
      if (rule.pattern.test(classNameText)) {
        findings.push(
          createFinding({
            component,
            file: relativePath,
            line,
            message: rule.message,
            recommendation: rule.recommendation,
            ruleId: rule.id,
            severity: rule.severity,
            snippet: tagText,
          }),
        );
      }
    }

    if (jsxLocalCssModuleRule.pattern.test(tagText)) {
      findings.push(
        createFinding({
          component,
          file: relativePath,
          line,
          message: jsxLocalCssModuleRule.message,
          recommendation: jsxLocalCssModuleRule.recommendation,
          ruleId: jsxLocalCssModuleRule.id,
          severity: jsxLocalCssModuleRule.severity,
          snippet: tagText,
        }),
      );
    }
  }

  return findings;
}

function scanNativeDisclosureElements({ content, lines, lineStarts, relativePath }) {
  const findings = [];

  if (relativePath === "src/components/ui/disclosure-card.tsx") {
    return findings;
  }

  const detailPattern = /<\s*details\b/g;
  let match;

  while ((match = detailPattern.exec(content)) !== null) {
    const startIndex = match.index;
    const endIndex = findOpeningTagEnd(content, startIndex);

    if (endIndex === -1) {
      continue;
    }

    const line = lineNumberFromIndex(lineStarts, startIndex);

    if (isIgnoredAtLine(lines, line)) {
      continue;
    }

    findings.push(
      createFinding({
        component: "details",
        file: relativePath,
        line,
        message: nativeDisclosureRule.message,
        recommendation: nativeDisclosureRule.recommendation,
        ruleId: nativeDisclosureRule.id,
        severity: nativeDisclosureRule.severity,
        snippet: content.slice(startIndex, endIndex),
      }),
    );
  }

  return findings;
}

function scanArbitraryClassLines({ lines, relativePath }) {
  const findings = [];

  lines.forEach((lineContent, index) => {
    const line = index + 1;

    if (!lineContent.includes("className") || isIgnoredAtLine(lines, line)) {
      return;
    }

    if (!arbitraryUtilityRule.pattern.test(lineContent)) {
      return;
    }

    const classification = classifyArbitraryUtilityLine({ lineContent, relativePath });
    const categoryDetails = LOW_CATEGORY_DETAILS[classification.lowCategory];

    findings.push(
      createFinding({
        component: undefined,
        disposition: classification.disposition,
        file: relativePath,
        line,
        lowCategory: classification.lowCategory,
        message: arbitraryUtilityRule.message,
        recommendation: categoryDetails?.recommendation ?? arbitraryUtilityRule.recommendation,
        ruleId: arbitraryUtilityRule.id,
        severity: arbitraryUtilityRule.severity,
        snippet: lineContent,
      }),
    );
  });

  return findings;
}

function extractCssClassName(selector) {
  const match = selector.match(/\.([_a-zA-Z]+[_a-zA-Z0-9-]*)/);
  return match?.[1] ?? "";
}

function cssPropertyPattern(propertyNames) {
  return new RegExp(`(?:^|[;\s])(?:${propertyNames.join("|")})\s*:`, "i");
}

function hasCssProperty(body, propertyNames) {
  return cssPropertyPattern(propertyNames).test(body);
}

function hasClassSignal(className, signals, { excludeSuffixes = [] } = {}) {
  if (!className) return false;

  const normalizedClassName = className.toLowerCase();
  const normalizedSignals = signals.map((signal) => signal.toLowerCase());
  const hasSignal = normalizedSignals.some((signal) => normalizedClassName.includes(signal));

  if (!hasSignal) return false;

  return !excludeSuffixes.some((suffix) => normalizedClassName.endsWith(suffix.toLowerCase()));
}

function classifyCssModuleBlock({ body, relativePath, selector }) {
  const className = extractCssClassName(selector);
  const isFeatureCssModule = relativePath.includes("/features/") && relativePath.endsWith(".module.css");
  const isSystemFixedStackFile = [
    "src/components/ui/fixed-action-bar.module.css",
    "src/components/ui/bottom-sheet.module.css",
  ].includes(relativePath);
  const findings = [];

  if (!isSystemFixedStackFile && hasCssProperty(body, ["position"]) && /position\s*:\s*(?:fixed|sticky)\b/.test(body) && hasCssProperty(body, ["bottom", "top", "z-index"])) {
    findings.push({
      id: "fixed-or-sticky-local-stack",
      severity: "alta",
      message: "CSS local define elemento fixed/sticky com top/bottom ou z-index.",
      recommendation:
        "Centralize barras fixas/sticky em AppShell, FixedActionBar, BottomSheet ou tokens de z-index/safe-area para evitar sobreposição visual.",
    });
  }

  if (!isFeatureCssModule) {
    return findings;
  }

  const hasSurfaceProperties = hasCssProperty(body, [
    "border",
    "border-radius",
    "background",
    "background-color",
    "box-shadow",
    "padding",
    "min-height",
    "height",
  ]);
  const hasBadgeProperties = hasCssProperty(body, ["max-width", "padding", "font-size", "border-radius", "background", "border"]);
  const hasButtonProperties = hasCssProperty(body, ["min-height", "height", "padding", "border-radius", "font-size", "background", "border"]);
  const hasFieldProperties = hasCssProperty(body, ["height", "min-height", "padding", "border-radius", "background", "border", "font-size"]);

  const isSurfaceClass = hasClassSignal(className, ["card", "surface", "panel"]);
  const isBadgeClass = hasClassSignal(className, ["badge", "pill", "tag"], {
    excludeSuffixes: ["icon", "iconsvg", "svg", "copy", "label", "value", "text", "count", "line", "meta"],
  });
  const isButtonClass = hasClassSignal(className, ["button", "trigger"], {
    excludeSuffixes: ["icon", "text", "label", "status"],
  }) || hasClassSignal(className, ["action"], { excludeSuffixes: ["icon", "text", "label", "status", "copy"] });
  const isFieldClass = hasClassSignal(className, ["input", "select", "textarea"]) ||
    hasClassSignal(className, ["field"], { excludeSuffixes: ["label", "hint", "error", "description"] });
  const isDisclosureClass = hasClassSignal(className, ["details", "accordion", "disclosure"]);

  if (isSurfaceClass && hasSurfaceProperties) {
    findings.push({
      id: "feature-css-module-surface",
      severity: "média",
      message: "CSS Module de feature redefine superfície de card/painel.",
      recommendation:
        "Mova border, background, radius, shadow e padding recorrentes para Card/CardLink/SummaryCard ou para uma primitive específica.",
    });
  }

  if (isBadgeClass && hasBadgeProperties) {
    findings.push({
      id: "feature-css-module-badge",
      severity: "média",
      message: "CSS Module de feature redefine aparência de badge/pill/tag.",
      recommendation: "Promova largura, densidade e shape para props do Badge base.",
    });
  }

  if (isButtonClass && hasButtonProperties) {
    findings.push({
      id: "feature-css-module-button",
      severity: "média",
      message: "CSS Module de feature redefine aparência ou densidade de botão/ação.",
      recommendation: "Promova shape, density, align ou variant para Button/ButtonLink.",
    });
  }

  if (isFieldClass && hasFieldProperties) {
    findings.push({
      id: "feature-css-module-field",
      severity: "média",
      message: "CSS Module de feature redefine controle de formulário.",
      recommendation: "Crie InputField/SelectField/TextareaField com estados de foco, erro e disabled centralizados.",
    });
  }

  if (isDisclosureClass && hasSurfaceProperties) {
    findings.push({
      id: "feature-css-module-disclosure",
      severity: "média",
      message: "CSS Module de feature redefine disclosure/accordion.",
      recommendation: "Crie uma primitive DisclosureCard/AccordionItem com foco, superfície e estados padronizados.",
    });
  }

  return findings;
}

function scanCssBlocks({ content, lineStarts, relativePath }) {
  const findings = [];
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = blockPattern.exec(content)) !== null) {
    const selector = match[1].trim();
    const body = match[2];
    const line = lineNumberFromIndex(lineStarts, match.index);
    const blockFindings = classifyCssModuleBlock({ body, relativePath, selector });

    for (const blockFinding of blockFindings) {
      findings.push(
        createFinding({
          file: relativePath,
          line,
          message: blockFinding.message,
          recommendation: blockFinding.recommendation,
          ruleId: blockFinding.id,
          severity: blockFinding.severity,
          snippet: `${selector} { ${collapseWhitespace(body)} }`,
        }),
      );
    }
  }

  return findings;
}

function scanCssLineRules({ lines, relativePath }) {
  const findings = [];
  const isTokenFile = relativePath === "src/styles/tokens.css";
  const isMotionFile = relativePath === "src/styles/motion.css";

  lines.forEach((lineContent, index) => {
    const line = index + 1;
    const trimmedLine = lineContent.trim();

    if (isIgnoredAtLine(lines, line)) {
      return;
    }

    if (!isMotionFile && trimmedLine.includes("!important")) {
      findings.push(
        createFinding({
          file: relativePath,
          line,
          message: "Uso de !important fora do reset de motion.",
          recommendation: "Remova o !important ou documente a exceção com ui-audit-ignore-next-line.",
          ruleId: "css-important",
          severity: "baixa",
          snippet: trimmedLine,
        }),
      );
    }

    if (!isTokenFile && /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/.test(trimmedLine)) {
      findings.push(
        createFinding({
          file: relativePath,
          line,
          message: "Cor ou sombra hardcoded fora dos tokens de tema.",
          recommendation: "Substitua por var(--color-*), var(--shadow-*) ou token semântico equivalente.",
          ruleId: "css-hardcoded-color",
          severity: "baixa",
          snippet: trimmedLine,
        }),
      );
    }
  });

  return findings;
}

function scanFile(filePath, root) {
  const relativePath = toPosixPath(path.relative(root, filePath));
  const content = readFileSync(filePath, "utf8");

  if (hasIgnoreFile(content)) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const lineStarts = buildLineStarts(content);
  const extension = path.extname(filePath);
  const findings = [];

  if (extension === ".tsx") {
    findings.push(...scanJsxFile({ content, lines, lineStarts, relativePath }));
    findings.push(...scanNativeDisclosureElements({ content, lines, lineStarts, relativePath }));
    findings.push(...scanArbitraryClassLines({ lines, relativePath }));
  }

  if (extension === ".css") {
    findings.push(...scanCssBlocks({ content, lineStarts, relativePath }));
    findings.push(...scanCssLineRules({ lines, relativePath }));
  }

  return findings;
}

function summarizeFindings(findings) {
  const summary = {
    alta: 0,
    média: 0,
    baixa: 0,
  };
  const byRule = new Map();
  const byLowCategory = new Map();
  const byLowDisposition = new Map();

  for (const finding of findings) {
    summary[finding.severity] += 1;
    byRule.set(finding.ruleId, (byRule.get(finding.ruleId) ?? 0) + 1);

    if (finding.severity === "baixa") {
      const lowCategory = finding.lowCategory ?? "review/generic-arbitrary";
      const disposition = finding.disposition ?? LOW_DISPOSITION.REVIEW;
      byLowCategory.set(lowCategory, (byLowCategory.get(lowCategory) ?? 0) + 1);
      byLowDisposition.set(disposition, (byLowDisposition.get(disposition) ?? 0) + 1);
    }
  }

  return { byLowCategory, byLowDisposition, byRule, summary };
}

function sortMapEntriesByCount(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function sortFindings(findings) {
  return findings.sort((a, b) => {
    const severityDifference = severityWeight[a.severity] - severityWeight[b.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    if (a.file !== b.file) {
      return a.file.localeCompare(b.file);
    }

    return a.line - b.line;
  });
}

function printTextReport({ files, findings, maxFindings, root }) {
  const { byLowCategory, byLowDisposition, byRule, summary } = summarizeFindings(findings);
  const visibleFindings = maxFindings === 0 ? findings : findings.slice(0, maxFindings);
  const hiddenCount = findings.length - visibleFindings.length;

  console.log("Auditoria UI/CSS de overrides locais");
  console.log(`Raiz: ${root}`);
  console.log(`Arquivos varridos: ${files.length}`);
  console.log(`Findings: ${findings.length} (alta: ${summary.alta}, média: ${summary.média}, baixa: ${summary.baixa})`);

  if (findings.length === 0) {
    console.log("\nNenhum padrão suspeito encontrado.");
    return;
  }

  console.log("\nResumo por regra:");

  for (const [ruleId, count] of sortMapEntriesByCount(byRule)) {
    console.log(`- ${ruleId}: ${count}`);
  }

  if (summary.baixa > 0) {
    console.log("\nResumo dos achados baixos:");

    for (const [disposition, count] of sortMapEntriesByCount(byLowDisposition)) {
      console.log(`- ${disposition}: ${count}`);
    }

    console.log("\nBaixos por categoria:");

    for (const [category, count] of sortMapEntriesByCount(byLowCategory)) {
      const label = LOW_CATEGORY_DETAILS[category]?.label ?? category;
      console.log(`- ${category}: ${count} — ${label}`);
    }
  }

  console.log("\nFindings:");

  for (const finding of visibleFindings) {
    const componentLabel = finding.component ? ` | ${finding.component}` : "";
    console.log(`\n[${finding.severity}] ${finding.ruleId}${componentLabel}`);
    console.log(`${finding.file}:${finding.line}`);
    console.log(`Problema: ${finding.message}`);

    if (finding.severity === "baixa") {
      const categoryLabel = LOW_CATEGORY_DETAILS[finding.lowCategory]?.label ?? finding.lowCategory;
      console.log(`Classificação baixa: ${finding.disposition} / ${finding.lowCategory} — ${categoryLabel}`);
    }

    console.log(`Recomendação: ${finding.recommendation}`);
    console.log(`Trecho: ${finding.snippet}`);
  }

  if (hiddenCount > 0) {
    console.log(`\n... ${hiddenCount} finding(s) ocultos. Use --max-findings=0 para imprimir todos.`);
  }
}

function printLowReviewReport({ files, findings, root }) {
  const lowFindings = findings.filter((finding) => finding.severity === "baixa");
  const { byLowCategory, byLowDisposition, summary } = summarizeFindings(findings);
  const candidateFindings = lowFindings.filter((finding) => finding.disposition === LOW_DISPOSITION.CANDIDATE);
  const reviewFindings = lowFindings.filter((finding) => finding.disposition === LOW_DISPOSITION.REVIEW);

  console.log("Revisão dos achados baixos de UI/CSS");
  console.log(`Raiz: ${root}`);
  console.log(`Arquivos varridos: ${files.length}`);
  console.log(`Findings totais: ${findings.length} (alta: ${summary.alta}, média: ${summary.média}, baixa: ${summary.baixa})`);

  if (lowFindings.length === 0) {
    console.log("\nNenhum achado baixo encontrado.");
    return;
  }

  console.log("\nLeitura dos baixos:");

  for (const [disposition, count] of sortMapEntriesByCount(byLowDisposition)) {
    console.log(`- ${disposition}: ${count}`);
  }

  console.log("\nCategorias:");

  for (const [category, count] of sortMapEntriesByCount(byLowCategory)) {
    const details = LOW_CATEGORY_DETAILS[category];
    console.log(`\n- ${category}: ${count}`);
    console.log(`  Tipo: ${details?.label ?? category}`);
    console.log(`  Ação: ${details?.recommendation ?? "Revise o contexto antes de refatorar."}`);
  }

  if (candidateFindings.length > 0) {
    console.log("\nAmostra de candidatos a refatoração:");

    for (const finding of candidateFindings.slice(0, 20)) {
      const categoryLabel = LOW_CATEGORY_DETAILS[finding.lowCategory]?.label ?? finding.lowCategory;
      console.log(`\n[${finding.lowCategory}] ${categoryLabel}`);
      console.log(`${finding.file}:${finding.line}`);
      console.log(`Trecho: ${finding.snippet}`);
    }
  }

  if (reviewFindings.length > 0) {
    console.log("\nAmostra de baixos para revisão contextual:");

    for (const finding of reviewFindings.slice(0, 10)) {
      const categoryLabel = LOW_CATEGORY_DETAILS[finding.lowCategory]?.label ?? finding.lowCategory;
      console.log(`\n[${finding.lowCategory}] ${categoryLabel}`);
      console.log(`${finding.file}:${finding.line}`);
      console.log(`Trecho: ${finding.snippet}`);
    }
  }
}

function shouldFailStrictMode(findings, { failOnLow }) {
  return findings.some((finding) => finding.severity === "alta" || finding.severity === "média" || (failOnLow && finding.severity === "baixa"));
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const root = path.resolve(options.root);
  const files = collectFiles(root, options.dirs);
  const findings = sortFindings(files.flatMap((file) => scanFile(file, root)));

  if (options.json) {
    const { byLowCategory, byLowDisposition, byRule, summary } = summarizeFindings(findings);
    console.log(
      JSON.stringify(
        {
          filesScanned: files.length,
          findings,
          summary,
          summaryByLowCategory: Object.fromEntries(byLowCategory),
          summaryByLowDisposition: Object.fromEntries(byLowDisposition),
          summaryByRule: Object.fromEntries(byRule),
        },
        null,
        2,
      ),
    );
  } else if (options.lowReview) {
    printLowReviewReport({ files, findings, root });
  } else {
    printTextReport({ files, findings, maxFindings: options.maxFindings, root });
  }

  if (options.strict && shouldFailStrictMode(findings, { failOnLow: options.failOnLow })) {
    process.exitCode = 1;
  }
}

main();
