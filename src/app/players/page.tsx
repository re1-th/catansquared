import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Card, Empty, PageTitle } from "@/components/ui";
import { loadLeague } from "@/lib/load";
import { playerStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage() {
  const { players, games, leagues, current } = await loadLeague();
  const stats = playerStats(players, games, leagues);
  const pointsOf = new Map(current.standings.map((s) => [s.playerId, s.points]));

  return (
    <>
      <PageTitle title="Players">Everyone who has played in the league.</PageTitle>
      {players.length === 0 ? (
        <Empty>No players found. Check the database connection.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.playerId} href={`/players/${s.playerId}`} className="group">
              <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-ring">
                <Avatar name={s.name} size="lg" />
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold tracking-tight">{s.name}</div>
                  <div className="tabular font-mono text-xs text-muted-foreground">
                    {pointsOf.get(s.playerId) ?? 0} pts now · {s.wins} wins · {s.gamesPlayed} games
                    {s.leaguesWon > 0 && ` · ${s.leaguesWon}× champion`}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
