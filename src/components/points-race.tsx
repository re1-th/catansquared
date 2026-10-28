import { POINTS_TO_WIN, type League } from "@/lib/league";
import { playerColor } from "@/lib/format";
import { LineChart } from "./line-chart";

/** Each player's league points after every game of the league. */
export function PointsRace({ league, nameOf, playerIds }: { league: League; nameOf: (id: number) => string; playerIds: number[] }) {
  const active = league.standings.filter((s) => s.gamesPlayed > 0);
  const series = active.map((s) => ({
    id: s.playerId,
    name: nameOf(s.playerId),
    color: playerColor(playerIds, s.playerId),
    values: [0, ...(league.pointsTimeline.get(s.playerId) ?? [])],
  }));
  const xLabels = ["Start", ...league.games.map((_, i) => `Game ${i + 1}`)];
  const top = Math.max(POINTS_TO_WIN + 1, ...series.flatMap((s) => s.values));

  return <LineChart series={series} xLabels={xLabels} yMin={0} yMax={top} step target={{ value: POINTS_TO_WIN, label: "10 to win" }} />;
}
