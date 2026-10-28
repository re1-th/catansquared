import type { Metadata } from "next";
import { BarList } from "@/components/bars";
import { LineChart } from "@/components/line-chart";
import { Card, Empty, PageTitle, PlayerLink, SectionTitle, StatTile } from "@/components/ui";
import { playerColor } from "@/lib/format";
import { loadLeague } from "@/lib/load";
import { highlights, playerStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Stats" };

export default async function StatsPage() {
  const { players, games, leagues } = await loadLeague();
  if (games.length === 0) {
    return (
      <>
        <PageTitle title="Stats" />
        <Empty>Stats appear once the first game is logged.</Empty>
      </>
    );
  }

  const stats = playerStats(players, games, leagues).filter((s) => s.gamesPlayed > 0);
  const byAvg = [...stats].sort((a, b) => b.avgScore - a.avgScore);
  const ids = players.map((p) => p.id);
  const gameDays = new Set(games.map((g) => g.playedOn)).size;
  const finished = leagues.filter((l) => l.championId !== null).length;

  // Running average across the whole history: flat through games a player missed.
  const progression = stats.map((s) => {
    const values: (number | null)[] = [];
    let last: number | null = null;
    let k = 0;
    for (const g of games) {
      if (s.avgProgression[k]?.[0] === g.number) last = s.avgProgression[k++][1];
      values.push(last === null ? null : Math.round(last * 100) / 100);
    }
    return { id: s.playerId, name: s.name, color: playerColor(ids, s.playerId), values };
  });

  const bar = (pick: (s: (typeof stats)[number]) => number, display?: (v: number) => string) =>
    stats.map((s) => ({ id: s.playerId, name: s.name, value: pick(s), display: display?.(pick(s)) }));

  return (
    <>
      <PageTitle title="Stats">Every game ever logged, across all leagues.</PageTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Games played" value={games.length} />
        <StatTile label="Game days" value={gameDays} />
        <StatTile label="Leagues finished" value={finished} />
        <StatTile label="Best average" value={byAvg[0].avgScore.toFixed(2)} detail={byAvg[0].name} />
      </div>

      <SectionTitle>Players</SectionTitle>
      <Card className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="eyebrow text-left">
              <th className="py-3 pl-5 pr-2 font-normal">Player</th>
              <th className="px-3 py-3 text-right font-normal">Avg score</th>
              <th className="px-3 py-3 text-right font-normal">Games</th>
              <th className="px-3 py-3 text-right font-normal">Attendance</th>
              <th className="px-3 py-3 text-right font-normal">Wins</th>
              <th className="px-3 py-3 text-right font-normal">Win %</th>
              <th className="px-3 py-3 text-right font-normal">LR</th>
              <th className="px-3 py-3 text-right font-normal">LA</th>
              <th className="py-3 pl-3 pr-5 text-right font-normal">Leagues won</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {byAvg.map((s) => (
              <tr key={s.playerId} className="border-t border-border">
                <td className="py-2.5 pl-5 pr-2"><PlayerLink id={s.playerId} name={s.name} /></td>
                <td className="px-3 text-right font-semibold">{s.avgScore.toFixed(2)}</td>
                <td className="px-3 text-right">{s.gamesPlayed}</td>
                <td className={`px-3 text-right ${s.attendancePct < 50 ? "text-destructive" : ""}`}>{s.attendancePct.toFixed(1)}%</td>
                <td className="px-3 text-right">{s.wins}</td>
                <td className="px-3 text-right">{s.winPct.toFixed(1)}%</td>
                <td className="px-3 text-right">{s.longestRoads}</td>
                <td className="px-3 text-right">{s.largestArmies}</td>
                <td className="pl-3 pr-5 text-right">{s.leaguesWon}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <SectionTitle>Average score over time</SectionTitle>
      <Card className="p-5">
        <LineChart series={progression} xLabels={games.map((g) => `Game ${g.number}`)} decimals={1} />
      </Card>

      <SectionTitle>Leaderboards</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <BarList title="Wins" items={bar((s) => s.wins)} />
        <BarList title="Win percentage" items={bar((s) => s.winPct, (v) => `${v.toFixed(1)}%`)} />
        <BarList title="Games played" items={bar((s) => s.gamesPlayed)} />
        <BarList title="Longest Roads taken" items={bar((s) => s.longestRoads)} />
        <BarList title="Largest Armies taken" items={bar((s) => s.largestArmies)} />
        <BarList title="Leagues won" items={bar((s) => s.leaguesWon)} />
      </div>

      <SectionTitle>Odds and ends</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {highlights(games, stats).map((h) => (
          <StatTile key={h.label} label={h.label} value={h.value} detail={h.detail} />
        ))}
      </div>
    </>
  );
}
