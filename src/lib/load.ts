import "server-only";
import { getLeagueData } from "./data";
import { computeLeagues } from "./league";

/** Everything a page needs: raw data plus the leagues derived from it. */
export async function loadLeague() {
  const { players, games } = await getLeagueData();
  const leagues = computeLeagues(
    games,
    players.map((p) => p.id),
  );
  const nameOf = new Map(players.map((p) => [p.id, p.name]));
  const leagueOfGame = new Map<number, number>();
  for (const l of leagues) for (const g of l.games) leagueOfGame.set(g.id, l.number);

  return {
    players,
    games,
    leagues,
    current: leagues[leagues.length - 1],
    nameOf: (id: number) => nameOf.get(id) ?? "Unknown",
    leagueOfGame,
  };
}
