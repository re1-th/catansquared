import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameForm } from "@/components/game-form";
import { PageTitle } from "@/components/ui";
import { loadLeague } from "@/lib/load";

export const metadata: Metadata = { title: "Edit game" };

export default async function EditGamePage({ params }: PageProps<"/games/[id]/edit">) {
  const { id } = await params;
  const { players, games } = await loadLeague();
  const game = games.find((g) => g.id === Number(id));
  if (!game) notFound();

  return (
    <>
      <PageTitle title={`Edit game ${game.number}`} />
      <GameForm players={players} game={game} />
    </>
  );
}
