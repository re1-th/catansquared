import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { query } from "./db";
import type { Game, Player } from "./types";

export const DATA_TAG = "league-data";

type GameRow = { id: number; played_on: string };
type ResultRow = {
  game_id: number;
  player_id: number;
  score: number;
  is_winner: boolean;
  longest_road: boolean;
  largest_army: boolean;
};

/** Every player and every game (oldest first). Invalidated by the game actions. */
export async function getLeagueData(): Promise<{ players: Player[]; games: Game[] }> {
  "use cache";
  cacheTag(DATA_TAG);
  cacheLife("max");

  const [players, gameRows, resultRows] = await Promise.all([
    query<Player>("SELECT id, name FROM players ORDER BY id"),
    query<GameRow>("SELECT id, played_on::text AS played_on FROM games ORDER BY played_on, id"),
    query<ResultRow>(
      "SELECT game_id, player_id, score, is_winner, longest_road, largest_army FROM game_players",
    ),
  ]);

  const resultsByGame = new Map<number, Game["results"]>();
  for (const r of resultRows) {
    const list = resultsByGame.get(r.game_id) ?? [];
    list.push({
      playerId: r.player_id,
      score: r.score,
      isWinner: r.is_winner,
      longestRoad: r.longest_road,
      largestArmy: r.largest_army,
    });
    resultsByGame.set(r.game_id, list);
  }

  const games = gameRows.map((g, i) => ({
    id: g.id,
    playedOn: g.played_on,
    number: i + 1,
    results: (resultsByGame.get(g.id) ?? []).sort((a, b) => b.score - a.score),
  }));

  return { players, games };
}
