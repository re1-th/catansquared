import { notFound } from "next/navigation";
import { Histogram } from "@/components/bars";
import { GameList } from "@/components/game-list";
import { LineChart } from "@/components/line-chart";
import { Avatar, Badge, Card, Empty, SectionTitle, StatTile } from "@/components/ui";
import { playerColor } from "@/lib/format";
import { isMatchPoint } from "@/lib/league";
import { loadLeague } from "@/lib/load";
import { playerStats } from "@/lib/stats";

export async function generateMetadata({ params }: PageProps<"/players/[id]">) {
  const { id } = await params;
  const { players } = await loadLeague();
  return { title: players.find((p) => p.id === Number(id))?.name ?? "Player" };
}

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const { players, games, leagues, current, nameOf } = await loadLeague();
  const player = players.find((p) => p.id === id);
  if (!player) notFound();

  const s = playerStats(players, games, leagues).find((x) => x.playerId === id)!;
  const allStats = playerStats(players, games, leagues).filter((x) => x.gamesPlayed > 0);
  const avgRank = [...allStats].sort((a, b) => b.avgScore - a.avgScore).findIndex((x) => x.playerId === id) + 1;
  const now = current.standings.find((x) => x.playerId === id);
  const leagueRank = current.standings.findIndex((x) => x.playerId === id) + 1;
  const titles = leagues.filter((l) => l.championId === id).map((l) => l.number);

  const scores = [...s.scoreFrequency.keys()];
  const histogram: [number, number][] = [];
  if (scores.length) {
    for (let v = Math.min(...scores); v <= Math.max(...scores); v++) histogram.push([v, s.scoreFrequency.get(v) ?? 0]);
  }
  const theirGames = games.filter((g) => g.results.some((r) => r.playerId === id)).reverse();

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center gap-5">
        <Avatar name={player.name} size="lg" />
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{player.name}</h1>
            {titles.length > 0 && <Badge>{titles.length}× champion</Badge>}
          </div>
          {now && (
            <p className="mt-2 text-muted-foreground">
              League {current.number}: <span className="text-foreground">{now.points} pts</span>, #{leagueRank}
              {now.gamesPlayed > 0 && isMatchPoint(now.points) && <span className="ml-2 font-mono text-xs uppercase tracking-wider text-signal">Match point</span>}
            </p>
          )}
        </div>
      </div>

      {s.gamesPlayed === 0 ? (
        <Empty>{player.name} hasn’t played a game yet.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Average score" value={s.avgScore.toFixed(2)} detail={`#${avgRank} of ${allStats.length}`} />
            <StatTile label="Wins" value={s.wins} detail={`${s.winPct.toFixed(1)}% of games`} />
            <StatTile label="Games played" value={`${s.gamesPlayed}/${games.length}`} detail={`${s.attendancePct.toFixed(1)}% attendance`} />
            <StatTile label="Leagues won" value={s.leaguesWon} detail={titles.length ? `League ${titles.join(", ")}` : undefined} />
            <StatTile label="Longest Roads" value={s.longestRoads} />
            <StatTile label="Largest Armies" value={s.largestArmies} />
            <StatTile label="9+ scores" value={s.highScores} />
            <StatTile label="Best win streak" value={s.bestStreak} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
            <div>
              <SectionTitle>Score frequency</SectionTitle>
              <Card className="p-5">
                <Histogram data={histogram} />
              </Card>
            </div>
            <div>
              <SectionTitle>Average score over time</SectionTitle>
              <Card className="p-5">
                <LineChart
                  series={[{
                    id,
                    name: player.name,
                    color: playerColor(players.map((p) => p.id), id),
                    values: s.avgProgression.map(([, v]) => Math.round(v * 100) / 100),
                  }]}
                  xLabels={s.avgProgression.map(([n]) => `Game ${n}`)}
                  decimals={1}
                  height={220}
                />
              </Card>
            </div>
          </div>

          <SectionTitle>Games</SectionTitle>
          <GameList games={theirGames} nameOf={nameOf} />
        </>
      )}
    </>
  );
}
