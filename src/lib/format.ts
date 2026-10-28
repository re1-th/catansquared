const SERIES_SLOTS = 8;

/**
 * A player's chart colour follows the player (their join order), never their rank,
 * so it stays the same on every chart. Players past the 8th share a neutral.
 */
export function playerColor(playerIds: number[], playerId: number) {
  const slot = [...playerIds].sort((a, b) => a - b).indexOf(playerId);
  return slot >= 0 && slot < SERIES_SLOTS ? `var(--series-${slot + 1})` : "var(--muted-foreground)";
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
