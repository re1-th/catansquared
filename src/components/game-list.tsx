import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Game } from "@/lib/types";
import { DeleteGameButton } from "./delete-game-button";
import { BonusMark, Card } from "./ui";

type Props = {
  games: Game[];
  nameOf: (id: number) => string;
  leagueOfGame?: Map<number, number>;
  /** Mark games that clinched a league. */
  clinchers?: Set<number>;
  editable?: boolean;
};

export function GameList({ games, nameOf, leagueOfGame, clinchers, editable }: Props) {
  return (
    <Card>
      <ul>
        {games.map((g, i) => (
          <li key={g.id} className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex shrink-0 items-baseline gap-3 sm:w-44 sm:flex-col sm:gap-0.5">
              <span className="tabular font-semibold">Game {g.number}</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(g.playedOn)}
                {leagueOfGame && <span className="eyebrow ml-2">L{leagueOfGame.get(g.id)}</span>}
              </span>
            </div>
            <ol className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {g.results.map((r) => (
                <li
                  key={r.playerId}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-sm ${
                    r.isWinner ? "border-signal/60 bg-signal/10" : "border-border"
                  }`}
                >
                  <Link href={`/players/${r.playerId}`} className="hover:underline underline-offset-4">
                    {nameOf(r.playerId)}
                  </Link>
                  <span className={`tabular font-mono text-xs ${r.isWinner ? "text-signal" : "text-muted-foreground"}`}>{r.score}</span>
                  {r.longestRoad && <BonusMark kind="road" />}
                  {r.largestArmy && <BonusMark kind="army" />}
                </li>
              ))}
            </ol>
            <div className="flex shrink-0 items-center gap-3">
              {clinchers?.has(g.id) && (
                <span className="font-mono text-[11px] uppercase tracking-wider text-signal">Clinched league</span>
              )}
              {editable && (
                <>
                  <Link href={`/games/${g.id}/edit`} className="text-sm text-muted-foreground hover:text-foreground">
                    Edit
                  </Link>
                  <DeleteGameButton id={g.id} number={g.number} />
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
