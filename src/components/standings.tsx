import { playerColor } from "@/lib/format";
import { BONUS_POINTS, POINTS_TO_WIN, isMatchPoint, type BonusRace, type League, type Standing } from "@/lib/league";
import { Badge, Card, PlayerLink } from "./ui";

function BonusCell({ count, holds }: { count: number; holds: boolean }) {
  return (
    <span className={`tabular ${holds ? "text-foreground" : "text-muted-foreground"}`}>
      {count}
      {holds && <span className="ml-1.5 font-mono text-[11px] text-signal">+{BONUS_POINTS}</span>}
    </span>
  );
}

function Progress({ points }: { points: number }) {
  const pct = Math.min(points / POINTS_TO_WIN, 1) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
      {isMatchPoint(points) ? (
        <span className="font-mono text-[11px] uppercase tracking-wider text-signal">Match point</span>
      ) : (
        <span className="tabular text-sm text-muted-foreground">{POINTS_TO_WIN - points} to go</span>
      )}
    </div>
  );
}

export function StandingsTable({ league, nameOf }: { league: League; nameOf: (id: number) => string }) {
  const finished = league.championId !== null;
  const rows = league.standings.filter((s) => s.gamesPlayed > 0 || !finished);

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="eyebrow text-left">
            <th className="py-3 pl-4 pr-2 font-normal sm:pl-5">Rank</th>
            <th className="px-2 py-3 font-normal">Player</th>
            <th className="px-2 py-3 text-right font-normal">Pts</th>
            <th className="px-2 py-3 text-right font-normal">Wins</th>
            <th className="px-2 py-3 text-right font-normal" title="Longest Roads taken">LR</th>
            <th className="px-2 py-3 text-right font-normal" title="Largest Armies taken">LA</th>
            <th className="hidden px-2 py-3 text-right font-normal sm:table-cell">Games</th>
            {!finished && <th className="hidden py-3 pl-6 pr-5 font-normal md:table-cell">Race to {POINTS_TO_WIN}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.playerId} className="border-t border-border">
              <td className="tabular py-3 pl-4 pr-2 sm:pl-5">
                <span className={i < 3 && s.points > 0 ? "text-signal" : ""}>{i + 1}</span>
              </td>
              <td className="max-w-40 px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <PlayerLink id={s.playerId} name={nameOf(s.playerId)} />
                  {league.championId === s.playerId && <Badge>Champion</Badge>}
                </div>
              </td>
              <td className="tabular px-2 py-3 text-right text-base font-semibold">{s.points}</td>
              <td className="tabular px-2 py-3 text-right">{s.wins}</td>
              <td className="px-2 py-3 text-right">
                <BonusCell count={s.longestRoads} holds={s.holdsLongestRoad} />
              </td>
              <td className="px-2 py-3 text-right">
                <BonusCell count={s.largestArmies} holds={s.holdsLargestArmy} />
              </td>
              <td className="tabular hidden px-2 py-3 text-right text-muted-foreground sm:table-cell">{s.gamesPlayed}</td>
              {!finished && (
                <td className="hidden py-3 pl-6 pr-5 md:table-cell">
                  <Progress points={s.points} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function raceLine(race: BonusRace, nameOf: (id: number) => string) {
  if (race.holderId === null) return { holder: "Not taken yet", rest: "" };
  const others = [...race.counts.entries()]
    .filter(([id]) => id !== race.holderId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id, n]) => `${nameOf(id)} ${n}`);
  return {
    holder: `${nameOf(race.holderId)} · ${race.counts.get(race.holderId)}`,
    rest: others.join(" · "),
  };
}

const PODIUM = [
  { place: 2, height: "h-10" },
  { place: 1, height: "h-16" },
  { place: 3, height: "h-6" },
];

/** Top three on points, drawn as a podium (2nd, 1st, 3rd). */
function Podium({ top, nameOf }: { top: Standing[]; nameOf: (id: number) => string }) {
  return (
    <div className="grid flex-1 grid-cols-3 items-end gap-1.5">
      {PODIUM.map(({ place, height }) => {
        const s = top[place - 1];
        const name = s ? nameOf(s.playerId) : null;
        return (
          <div key={place} className="flex min-w-0 flex-col items-center text-center">
            <span className={`w-full truncate font-semibold tracking-tight ${place === 1 ? "text-base" : "text-sm"}`}>
              {name ?? "–"}
            </span>
            <span className="tabular mb-1.5 font-mono text-[11px] opacity-60">{s ? `${s.points} pts` : " "}</span>
            <div
              className={`grid w-full place-items-center rounded-t-md border-t-[3px] bg-current/10 ${height}`}
              style={{ borderTopColor: name ? playerColor(name) : "transparent" }}
            >
              <span className="tabular font-mono text-sm opacity-70">{place}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The inverted "Current leaders" panel, after FieldRank's rankings page. */
export function LeadersCard({ league, nameOf }: { league: League; nameOf: (id: number) => string }) {
  const top = league.standings.filter((s) => s.points > 0).slice(0, 3);
  const rows = [
    { label: "Road", ...raceLine(league.longestRoad, nameOf) },
    { label: "Army", ...raceLine(league.largestArmy, nameOf) },
  ];

  return (
    <div className="rounded-xl bg-hero p-5 text-hero-foreground">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">Current leaders</span>
        <Badge>League {league.number}</Badge>
      </div>
      <div className="flex gap-4 pb-3 pt-2">
        <span className="w-12 shrink-0 self-end pb-1 font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">Points</span>
        {top.length > 0 ? (
          <Podium top={top} nameOf={nameOf} />
        ) : (
          <span className="text-lg font-semibold tracking-tight">No games yet</span>
        )}
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex gap-4 border-t border-current/15 py-3">
          <span className="w-12 shrink-0 pt-1 font-mono text-[11px] uppercase tracking-[0.08em] opacity-60">{r.label}</span>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold tracking-tight">{r.holder}</div>
            {r.rest && <div className="mt-0.5 truncate font-mono text-xs opacity-60">{r.rest}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
