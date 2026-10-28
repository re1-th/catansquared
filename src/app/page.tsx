import Link from "next/link";
import { GameList } from "@/components/game-list";
import { PointsRace } from "@/components/points-race";
import { LeadersCard, StandingsTable } from "@/components/standings";
import { Badge, Card, Empty, PageTitle, SectionTitle } from "@/components/ui";
import { loadLeague } from "@/lib/load";

export default async function RankingsPage() {
  const { current, leagues, players, nameOf } = await loadLeague();
  const previous = leagues.length > 1 ? leagues[leagues.length - 2] : null;
  const recent = [...current.games].reverse().slice(0, 5);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <PageTitle
          title={`League ${current.number}`}
          badge={<Badge tone="outline">{current.games.length ? "In progress" : "Not started"}</Badge>}
        >
          <p>
            First to 10 points takes the league. A win is worth 1. Holding the most Longest Roads or Largest Armies
            is worth 2 each. The title can only be clinched with a game win.
          </p>
          {previous && previous.championId !== null && (
            <p className="mt-3 text-sm">
              Last champion:{" "}
              <Link href={`/players/${previous.championId}`} className="text-foreground underline underline-offset-4">
                {nameOf(previous.championId)}
              </Link>{" "}
              in <Link href="/leagues" className="underline underline-offset-4">League {previous.number}</Link>
            </p>
          )}
        </PageTitle>
        <LeadersCard league={current} nameOf={nameOf} />
      </div>

      {players.length === 0 ? (
        <Empty>
          No players yet. <Link href="/games/new" className="text-foreground underline underline-offset-4">Log the first game</Link> to add them.
        </Empty>
      ) : (
        <StandingsTable league={current} nameOf={nameOf} />
      )}

      {current.games.length > 0 && (
        <>
          <SectionTitle>Points race</SectionTitle>
          <Card className="p-5">
            <PointsRace league={current} nameOf={nameOf} playerIds={players.map((p) => p.id)} />
          </Card>

          <SectionTitle aside={<Link href="/games" className="text-sm text-muted-foreground hover:text-foreground">All games →</Link>}>
            Recent games
          </SectionTitle>
          <GameList games={recent} nameOf={nameOf} />
        </>
      )}
    </>
  );
}
