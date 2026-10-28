import type { Metadata } from "next";
import Link from "next/link";
import { StandingsTable } from "@/components/standings";
import { Badge, Empty, PageTitle } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { loadLeague } from "@/lib/load";

export const metadata: Metadata = { title: "Leagues" };

export default async function LeaguesPage() {
  const { leagues, nameOf } = await loadLeague();
  const finished = leagues.filter((l) => l.championId !== null).reverse();

  return (
    <>
      <PageTitle title="Leagues">
        A league ends the moment someone wins a game while on 10 or more points. The next game starts a new one.
      </PageTitle>
      {finished.length === 0 ? (
        <Empty>
          No league has been won yet. <Link href="/" className="text-foreground underline underline-offset-4">See the current standings</Link>.
        </Empty>
      ) : (
        <div className="space-y-12">
          {finished.map((l) => {
            const first = l.games[0];
            const last = l.games[l.games.length - 1];
            return (
              <section key={l.number}>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight">League {l.number}</h2>
                  <Badge>Won by {nameOf(l.championId!)}</Badge>
                  <span className="eyebrow">
                    {l.games.length} games · {formatDate(first.playedOn)} – {formatDate(last.playedOn)}
                  </span>
                </div>
                <StandingsTable league={l} nameOf={nameOf} />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
