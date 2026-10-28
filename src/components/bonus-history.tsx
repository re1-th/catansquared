import Link from "next/link";
import { formatDate, playerColor } from "@/lib/format";
import type { BonusRace, League } from "@/lib/league";
import { Card } from "./ui";

function PlayerName({ id, nameOf }: { id: number; nameOf: (id: number) => string }) {
  const name = nameOf(id);
  return (
    <Link href={`/players/${id}`} className="inline-flex items-center gap-2 hover:underline underline-offset-4">
      <span className="size-2 shrink-0 rounded-full" style={{ background: playerColor(name) }} aria-hidden />
      {name}
    </Link>
  );
}

function RaceTable({ title, race, league, nameOf }: { title: string; race: BonusRace; league: League; nameOf: (id: number) => string }) {
  return (
    <Card className="overflow-x-auto">
      <h3 className="eyebrow px-4 pt-4 sm:px-5">{title}</h3>
      {race.history.length === 0 ? (
        <p className="px-4 pb-5 pt-3 text-sm text-muted-foreground sm:px-5">Not taken yet.</p>
      ) : (
        <table className="mt-2 w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="eyebrow text-left">
              <th className="py-2.5 pl-4 pr-2 font-normal sm:pl-5">Game</th>
              <th className="px-2 py-2.5 font-normal">Holder</th>
              <th className="px-2 py-2.5 font-normal">Took it from</th>
            </tr>
          </thead>
          <tbody>
            {race.history.map((change, i) => {
              const game = league.games[change.gameIndex];
              const current = i === race.history.length - 1;
              return (
                <tr key={change.gameIndex} className="border-t border-border">
                  <td className="py-2.5 pl-4 pr-2 sm:pl-5">
                    <div className="tabular">Game {game.number}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(game.playedOn, { day: "numeric", month: "short" })}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <PlayerName id={change.holderId} nameOf={nameOf} />
                      <span className="tabular font-mono text-xs text-muted-foreground">{change.count}</span>
                      {current && <span className="font-mono text-[11px] uppercase tracking-wider text-signal">Holds</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 pr-4 sm:pr-5">
                    {change.fromId === null ? (
                      <span className="text-muted-foreground">First to take it</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PlayerName id={change.fromId} nameOf={nameOf} />
                        <span className="tabular font-mono text-xs text-muted-foreground">{change.fromCount}</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/** Who has held Longest Road and Largest Army this league, and who they took it from. Counts are as of that game. */
export function BonusHistory({ league, nameOf }: { league: League; nameOf: (id: number) => string }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
      <RaceTable title="Longest Road" race={league.longestRoad} league={league} nameOf={nameOf} />
      <RaceTable title="Largest Army" race={league.largestArmy} league={league} nameOf={nameOf} />
    </div>
  );
}
