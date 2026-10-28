import type { Metadata } from "next";
import { GameForm } from "@/components/game-form";
import { PageTitle } from "@/components/ui";
import { loadLeague } from "@/lib/load";

export const metadata: Metadata = { title: "Add game" };

export default async function NewGamePage() {
  const { players } = await loadLeague();
  return (
    <>
      <PageTitle title="Add game">Pick who played, then enter scores. The winner gets +1 added to their score when the game is saved.</PageTitle>
      <GameForm players={players} />
    </>
  );
}
