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

function leader(stats: PlayerStats[], pick: (s: PlayerStats) => number) {
  const best = [...stats].sort((a, b) => pick(b) - pick(a))[0];
  return best && pick(best) > 0 ? { name: best.name, value: pick(best) } : null;
}

/** The miscellaneous stats carried over from the SMT dashboard. */
export function highlights(games: Game[], stats: PlayerStats[]): Highlight[] {
  const winners = games.map((g) => g.results.find((r) => r.isWinner)).filter((r) => r !== undefined);
  const withArmy = games.filter((g) => g.results.some((r) => r.largestArmy)).length;
  const withRoad = games.filter((g) => g.results.some((r) => r.longestRoad)).length;
  const winnersWithArmy = winners.filter((r) => r.largestArmy).length;
  const winnersWithRoad = winners.filter((r) => r.longestRoad).length;

  const perDay = new Map<string, number>();
  for (const g of games) perDay.set(g.playedOn, (perDay.get(g.playedOn) ?? 0) + 1);

  const nineNoWin = new Map<number, number>();
  for (const g of games) {
    for (const r of g.results) {
      if (r.score === 9 && !r.isWinner) nineNoWin.set(r.playerId, (nineNoWin.get(r.playerId) ?? 0) + 1);
    }
  }
  const nines = leader(stats, (s) => nineNoWin.get(s.playerId) ?? 0);
  const streak = leader(stats, (s) => s.bestStreak);
  const high = leader(stats, (s) => s.highScores);

  return [
    { label: "Winners with Largest Army", value: pct(winnersWithArmy, winners.length) },
    { label: "Winners with Longest Road", value: pct(winnersWithRoad, winners.length) },
    { label: "Largest Army win rate", value: pct(winnersWithArmy, withArmy), detail: "of games where it was taken" },
    { label: "Longest Road win rate", value: pct(winnersWithRoad, withRoad), detail: "of games where it was taken" },
    { label: "Most consecutive wins", value: streak ? String(streak.value) : "–", detail: streak?.name },
    { label: "Most 9+ scores", value: high ? String(high.value) : "–", detail: high?.name },
    { label: "Most 9s without winning", value: nines ? String(nines.value) : "–", detail: nines?.name },
    { label: "Days with two or more games", value: String([...perDay.values()].filter((n) => n >= 2).length) },
  ];
}
