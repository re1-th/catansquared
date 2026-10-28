"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addGame, updateGame } from "@/app/actions";
import { todayIso } from "@/lib/format";
import type { Game, Player } from "@/lib/types";
import { Avatar, Card } from "./ui";

type Props = { players: Player[]; game?: Game };

const inputClass =
  "rounded-lg border border-border bg-card px-3 py-2 text-base outline-none transition-colors focus:border-ring";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold tracking-tight">
        <span className="eyebrow">0{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Pick({ checked, onChange, label, name }: { checked: boolean; onChange: () => void; label: string; name: string }) {
  return (
    <label className="grid size-11 cursor-pointer place-items-center" title={label}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" aria-label={label} />
      <span
        className={`grid size-6 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
          checked ? "border-signal bg-signal" : "border-border"
        }`}
      >
        <span className={`size-2 rounded-full ${checked ? "bg-signal-foreground" : ""}`} />
      </span>
    </label>
  );
}

export function GameForm({ players, game }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(game?.playedOn ?? todayIso());
  const [selected, setSelected] = useState<number[]>(game?.results.map((r) => r.playerId) ?? []);
  const [scores, setScores] = useState<Record<number, string>>(
    Object.fromEntries(game?.results.map((r) => [r.playerId, String(r.score)]) ?? []),
  );
  const [winner, setWinner] = useState<number | null>(game?.results.find((r) => r.isWinner)?.playerId ?? null);
  const [road, setRoad] = useState<number | null>(game?.results.find((r) => r.longestRoad)?.playerId ?? null);
  const [army, setArmy] = useState<number | null>(game?.results.find((r) => r.largestArmy)?.playerId ?? null);
  const [error, setError] = useState<string | null>(null);

  const nameOf = (id: number) => players.find((p) => p.id === id)?.name ?? "";

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      if (winner === id) setWinner(null);
      if (road === id) setRoad(null);
      if (army === id) setArmy(null);
    } else {
      setSelected([...selected, id]);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const input = {
      playedOn: date,
      results: selected.map((id) => ({
        playerId: id,
        score: scores[id] === undefined || scores[id] === "" ? NaN : Number(scores[id]),
        isWinner: winner === id,
        longestRoad: road === id,
        largestArmy: army === id,
      })),
    };
    if (input.results.some((r) => Number.isNaN(r.score))) {
      setError("Enter a score for every player.");
      return;
    }
    startTransition(async () => {
      const res = game ? await updateGame(game.id, input) : await addGame(input);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(game ? "/games" : "/");
    });
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <Step n={1} title="Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
      </Step>

      <Step n={2} title="Who played">
        <div className="flex flex-wrap gap-2">
          {players.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-3 text-sm transition-colors ${
                  on ? "border-foreground bg-foreground text-background" : "border-border hover:border-ring"
                }`}
              >
                <Avatar name={p.name} />
                {p.name}
              </button>
            );
          })}
        </div>
      </Step>

      <Step n={3} title="Results">
        {selected.length === 0 ? (
          <p className="text-muted-foreground">Pick at least two players above.</p>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="eyebrow text-left">
                  <th className="py-3 pl-4 pr-2 font-normal">Player</th>
                  <th className="px-2 py-3 font-normal">Score</th>
                  <th className="px-1 py-3 text-center font-normal">Winner</th>
                  <th className="px-1 py-3 text-center font-normal" title="Longest Road">Road</th>
                  <th className="px-1 py-3 pr-4 text-center font-normal" title="Largest Army">Army</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => (
                  <tr key={id} className="border-t border-border">
                    <td className="py-2 pl-4 pr-2">
                      <span className="flex items-center gap-2">
                        <Avatar name={nameOf(id)} />
                        <span className="truncate">{nameOf(id)}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={30}
                        value={scores[id] ?? ""}
                        onChange={(e) => setScores({ ...scores, [id]: e.target.value })}
                        className={`${inputClass} tabular w-20 py-1.5`}
                        aria-label={`${nameOf(id)} score`}
                      />
                    </td>
                    <td className="px-1"><div className="flex justify-center"><Pick name="winner" label={`${nameOf(id)} won`} checked={winner === id} onChange={() => setWinner(id)} /></div></td>
                    <td className="px-1"><div className="flex justify-center"><Pick name="road" label={`${nameOf(id)} had Longest Road`} checked={road === id} onChange={() => setRoad(id)} /></div></td>
                    <td className="px-1 pr-4"><div className="flex justify-center"><Pick name="army" label={`${nameOf(id)} had Largest Army`} checked={army === id} onChange={() => setArmy(id)} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3 text-sm text-muted-foreground">
              <button type="button" onClick={() => setRoad(null)} disabled={road === null} className="hover:text-foreground disabled:opacity-40">
                Nobody had Longest Road
              </button>
              <button type="button" onClick={() => setArmy(null)} disabled={army === null} className="hover:text-foreground disabled:opacity-40">
                Nobody had Largest Army
              </button>
            </div>
          </Card>
        )}
      </Step>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || selected.length < 2}
          className="rounded-lg bg-foreground px-5 py-2.5 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Saving…" : game ? "Save changes" : "Save game"}
        </button>
        <Link href={game ? "/games" : "/"} className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
