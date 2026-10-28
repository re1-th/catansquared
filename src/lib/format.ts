import { PLAYER_NAMES } from "./players";

/** Each player's colour (defined per theme in globals.css); anyone not in the list gets a neutral. */
export function playerColor(name: string) {
  return PLAYER_NAMES.includes(name) ? `var(--player-${name.toLowerCase()})` : "var(--muted-foreground)";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

export function formatDate(isoDate: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
