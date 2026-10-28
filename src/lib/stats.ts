import type { League } from "./league";
import type { Game, Player } from "./types";

export type PlayerStats = {
  playerId: number;
  name: string;
  gamesPlayed: number;
  wins: number;
  winPct: number;
  avgScore: number;
  /** Share of game days the player turned up to. */
  attendancePct: number;
  longestRoads: number;
  largestArmies: number;
  highScores: number;
  leaguesWon: number;
  bestStreak: number;
  scoreFrequency: Map<number, number>;
  /** Running average after each game the player played: [game number, average]. */
  avgProgression: [number, number][];
};

export type Highlight = { label: string; value: string; detail?: string };

export function playerStats(players: Player[], games: Game[], leagues: League[]): PlayerStats[] {
  const gameDays = new Set(games.map((g) => g.playedOn)).size;

  return players.map((p) => {
    let total = 0;
    let wins = 0;
    let longestRoads = 0;
    let largestArmies = 0;
    let highScores = 0;
    let streak = 0;
    let bestStreak = 0;
    const days = new Set<string>();
    const scoreFrequency = new Map<number, number>();
    const avgProgression: [number, number][] = [];

    for (const g of games) {
      const r = g.results.find((x) => x.playerId === p.id);
      if (!r) continue;
      days.add(g.playedOn);
      total += r.score;
      scoreFrequency.set(r.score, (scoreFrequency.get(r.score) ?? 0) + 1);
      if (r.score >= 9) highScores++;
      if (r.longestRoad) longestRoads++;
      if (r.largestArmy) largestArmies++;
      if (r.isWinner) {
        wins++;
        bestStreak = Math.max(bestStreak, ++streak);
      } else {
        streak = 0;
      }
      avgProgression.push([g.number, total / (avgProgression.length + 1)]);
    }

    const gamesPlayed = avgProgression.length;
    return {
      playerId: p.id,
      name: p.name,
      gamesPlayed,
      wins,
      winPct: gamesPlayed ? (wins / gamesPlayed) * 100 : 0,
      avgScore: gamesPlayed ? total / gamesPlayed : 0,
      attendancePct: gameDays ? (days.size / gameDays) * 100 : 0,
      longestRoads,
      largestArmies,
      highScores,
      leaguesWon: leagues.filter((l) => l.championId === p.id).length,
      bestStreak,
      scoreFrequency,
      avgProgression,
    };
  });
}

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "–");

/** Whoever has the highest count; ties are listed together. Null when nobody has any. */
function leader(stats: PlayerStats[], pick: (s: PlayerStats) => number) {
  const best = Math.max(0, ...stats.map(pick));
  if (best === 0) return null;
  const names = stats.filter((s) => pick(s) === best).map((s) => s.name);
  return { value: best, name: names.join(" & ") };
}

function tally(counts: Map<number, number>, playerId: number) {
  counts.set(playerId, (counts.get(playerId) ?? 0) + 1);
}

const most = (label: string, top: ReturnType<typeof leader>, detail?: string): Highlight => ({
  label,
  value: top ? String(top.value) : "–",
  detail: top ? (detail ? `${top.name} · ${detail}` : top.name) : undefined,
});

/** The miscellaneous stats: the ones carried over from SMT plus a few league curiosities. */
export function highlights(games: Game[], stats: PlayerStats[], leagues: League[]): Highlight[] {
  const winners = games.map((g) => g.results.find((r) => r.isWinner)).filter((r) => r !== undefined);
  const withArmy = games.filter((g) => g.results.some((r) => r.largestArmy)).length;
  const withRoad = games.filter((g) => g.results.some((r) => r.longestRoad)).length;
  const winnersWithArmy = winners.filter((r) => r.largestArmy).length;
  const winnersWithRoad = winners.filter((r) => r.longestRoad).length;

  const perDay = new Map<string, number>();
  for (const g of games) perDay.set(g.playedOn, (perDay.get(g.playedOn) ?? 0) + 1);

  const nineNoWin = new Map<number, number>();
  const seconds = new Map<number, number>();
  const lasts = new Map<number, number>();
  const narrowWins = new Map<number, number>();
  const doubles = new Map<number, number>();
  // The game where everyone except the winner scored least on average.
  let rout: { avg: number; game: Game; winnerId: number } | null = null;

  for (const g of games) {
    const winner = g.results.find((r) => r.isWinner);
    const others = g.results.filter((r) => !r.isWinner);
    for (const r of g.results) {
      if (r.score === 9 && !r.isWinner) tally(nineNoWin, r.playerId);
      if (r.longestRoad && r.largestArmy) tally(doubles, r.playerId);
    }
    if (!winner || others.length === 0) continue;

    // Ties share the placing: everyone on the best losing score is second, everyone on the lowest is last.
    const runnerUp = Math.max(...others.map((r) => r.score));
    const bottom = Math.min(...others.map((r) => r.score));
    for (const r of others) {
      if (r.score === runnerUp) tally(seconds, r.playerId);
      if (r.score === bottom) tally(lasts, r.playerId);
    }
    if (winner.score - runnerUp === 1) tally(narrowWins, winner.playerId);

    const avg = others.reduce((sum, r) => sum + r.score, 0) / others.length;
    if (!rout || avg < rout.avg) rout = { avg, game: g, winnerId: winner.playerId };
  }

  // Taking Longest Road or Largest Army away from whoever held it.
  const steals = new Map<number, number>();
  for (const l of leagues) {
    for (const change of [...l.longestRoad.history, ...l.largestArmy.history]) {
      if (change.fromId !== null) tally(steals, change.holderId);
    }
  }

  // Games played since each player's last win (their whole record if they've never won).
  const drought = new Map<number, number>();
  for (const s of stats) {
    let run = 0;
    for (let i = games.length - 1; i >= 0; i--) {
      const r = games[i].results.find((x) => x.playerId === s.playerId);
      if (!r) continue;
      if (r.isWinner) break;
      run++;
    }
    drought.set(s.playerId, run);
  }

  const by = (counts: Map<number, number>) => leader(stats, (s) => counts.get(s.playerId) ?? 0);
  const nameOf = (id: number) => stats.find((s) => s.playerId === id)?.name ?? "Unknown";

  return [
    { label: "Winners with Largest Army", value: pct(winnersWithArmy, winners.length) },
    { label: "Winners with Longest Road", value: pct(winnersWithRoad, winners.length) },
    { label: "Largest Army win rate", value: pct(winnersWithArmy, withArmy), detail: "of games where it was taken" },
    { label: "Longest Road win rate", value: pct(winnersWithRoad, withRoad), detail: "of games where it was taken" },
    most("Most consecutive wins", leader(stats, (s) => s.bestStreak)),
    most("Most 9+ scores", leader(stats, (s) => s.highScores)),
    most("Most 9s without winning", by(nineNoWin)),
    { label: "Days with two or more games", value: String([...perDay.values()].filter((n) => n >= 2).length) },
    most("Bridesmaid", by(seconds), "second places"),
    most("Wooden spoon", by(lasts), "last places"),
    most("Photo finish", by(narrowWins), "wins by 1 point"),
    rout
      ? {
          label: "Most one-sided game",
          value: `${rout.avg.toFixed(1)} avg`,
          detail: `Losers' average in game ${rout.game.number}, won by ${nameOf(rout.winnerId)}`,
        }
      : { label: "Most one-sided game", value: "–" },
    most("Double whammy", by(doubles), "games with both LR & LA"),
    most("Bonus thief", by(steals), "times taking LR/LA from the holder"),
    most("Longest drought", by(drought), "games since a win"),
  ];
}
