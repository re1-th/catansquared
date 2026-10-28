import type { Metadata } from "next";
import Link from "next/link";
import { GameList } from "@/components/game-list";
import { Empty, PageTitle } from "@/components/ui";
import { loadLeague } from "@/lib/load";

export const metadata: Metadata = { title: "Games" };

export default async function GamesPage() {
  const { games, leagues, nameOf, leagueOfGame } = await loadLeague();
  const clinchers = new Set(
    leagues.filter((l) => l.championId !== null).map((l) => l.games[l.games.length - 1].id),
  );

  return (
    <>
      <PageTitle title="Games" />
      {games.length === 0 ? (
        <Empty>
          No games yet. <Link href="/games/new" className="text-foreground underline underline-offset-4">Log the first one</Link>.
        </Empty>
      ) : (
        <GameList
          games={[...games].reverse()}
          nameOf={nameOf}
          leagueOfGame={leagueOfGame}
          clinchers={clinchers}
          editable
        />
      )}
    </>
  );
}
