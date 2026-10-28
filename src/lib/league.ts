import type { Game } from "./types";

export const POINTS_TO_WIN = 10;
export const BONUS_POINTS = 2;

/**
 * Who holds a bonus (Longest Road or Largest Army) across a league. The holder is
 * whoever has taken it the most times; on a tie it stays with whoever reached
 * that count first, so it only changes hands when someone strictly passes them.
 */
export type BonusRace = {
  holderId: number | null;
  counts: Map<number, number>;
};

export type Standing = {
  playerId: number;
  points: number;
  wins: number;
  longestRoads: number;
  largestArmies: number;
  holdsLongestRoad: boolean;
  holdsLargestArmy: boolean;
  gamesPlayed: number;
  /** Index (within the league) of the game after which the player reached their current points. */
  reachedAt: number;
};

export type League = {
  /** 1-based. */
  number: number;
  games: Game[];
  championId: number | null;
  standings: Standing[];
  longestRoad: BonusRace;
  largestArmy: BonusRace;
  /** points[playerId][i] = points after the i-th game of the league. */
  pointsTimeline: Map<number, number[]>;
};

function takeBonus(race: BonusRace, playerId: number) {
  const count = (race.counts.get(playerId) ?? 0) + 1;
  race.counts.set(playerId, count);
  if (race.holderId === null) {
    race.holderId = playerId;
  } else if (race.holderId !== playerId && count > (race.counts.get(race.holderId) ?? 0)) {
    race.holderId = playerId;
  }
}

function newLeague(number: number): League {
  return {
    number,
    games: [],
    championId: null,
    standings: [],
    longestRoad: { holderId: null, counts: new Map() },
    largestArmy: { holderId: null, counts: new Map() },
    pointsTimeline: new Map(),
  };
}

function pointsFor(league: League, wins: Map<number, number>, playerId: number) {
  let points = wins.get(playerId) ?? 0;
  if (league.longestRoad.holderId === playerId) points += BONUS_POINTS;
  if (league.largestArmy.holderId === playerId) points += BONUS_POINTS;
  return points;
}

function rankStandings(standings: Standing[]) {
  return standings.sort(
    (a, b) => b.points - a.points || b.wins - a.wins || a.reachedAt - b.reachedAt || a.playerId - b.playerId,
  );
}

/**
 * Splits the full game history (oldest first) into consecutive leagues. A league
 * ends when a game's winner finishes that game on POINTS_TO_WIN or more; points
 * gained from bonuses alone never end it. The next game starts a fresh league.
 * The last league is the current one (it may have no games yet).
 */
export function computeLeagues(games: Game[], playerIds: number[]): League[] {
  const leagues: League[] = [];
  let league = newLeague(1);
  let wins = new Map<number, number>();
  let played = new Map<number, number>();
  let reachedAt = new Map<number, number>();

  const finalise = (l: League) => {
    const ids = new Set([...playerIds, ...played.keys()]);
    l.standings = rankStandings(
      [...ids].map((id) => ({
        playerId: id,
        points: pointsFor(l, wins, id),
        wins: wins.get(id) ?? 0,
        longestRoads: l.longestRoad.counts.get(id) ?? 0,
        largestArmies: l.largestArmy.counts.get(id) ?? 0,
        holdsLongestRoad: l.longestRoad.holderId === id,
        holdsLargestArmy: l.largestArmy.holderId === id,
        gamesPlayed: played.get(id) ?? 0,
        reachedAt: reachedAt.get(id) ?? -1,
      })),
    );
  };

  for (const game of games) {
    const index = league.games.length;
    league.games.push(game);
    const before = new Map(playerIds.map((id) => [id, pointsFor(league, wins, id)]));

    let winnerId: number | null = null;
    for (const r of game.results) {
      played.set(r.playerId, (played.get(r.playerId) ?? 0) + 1);
      if (r.isWinner) {
        winnerId = r.playerId;
        wins.set(r.playerId, (wins.get(r.playerId) ?? 0) + 1);
      }
      if (r.longestRoad) takeBonus(league.longestRoad, r.playerId);
      if (r.largestArmy) takeBonus(league.largestArmy, r.playerId);
    }

    const ids = new Set([...playerIds, ...played.keys()]);
    for (const id of ids) {
      const points = pointsFor(league, wins, id);
      if (points !== (before.get(id) ?? 0)) reachedAt.set(id, index);
      const timeline = league.pointsTimeline.get(id) ?? new Array(index).fill(0);
      timeline.push(points);
      league.pointsTimeline.set(id, timeline);
    }

    if (winnerId !== null && pointsFor(league, wins, winnerId) >= POINTS_TO_WIN) {
      league.championId = winnerId;
      finalise(league);
      leagues.push(league);
      league = newLeague(league.number + 1);
      wins = new Map();
      played = new Map();
      reachedAt = new Map();
    }
  }

  finalise(league);
  leagues.push(league);
  return leagues;
}

/** "Match point" means the player's next game win takes the league. */
export function isMatchPoint(points: number) {
  return points + 1 >= POINTS_TO_WIN;
}
