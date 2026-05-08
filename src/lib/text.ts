export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0) ?? "")
    .join("")
    .toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "#5c3a1e", text: "#e8c89a" },
  { bg: "#4a5d3a", text: "#d4e4bc" },
  { bg: "#6b3a2e", text: "#f0c4b8" },
  { bg: "#3d4f5f", text: "#b8d4e8" },
  { bg: "#5e4a2a", text: "#e8d8a8" },
  { bg: "#4a3a5e", text: "#d8c8f0" },
  { bg: "#3a5e4a", text: "#b8e8cc" },
  { bg: "#6b4a3a", text: "#f0d8c4" },
  { bg: "#3e4a3a", text: "#c8dcc4" },
  { bg: "#5e3a4a", text: "#e8c4d0" },
  { bg: "#4a5e5a", text: "#c4e0dc" },
  { bg: "#5e5a3a", text: "#e8e4b8" },
];

export function avatarColorForName(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
