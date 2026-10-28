import Link from "next/link";
import { playerColor } from "@/lib/format";
import { Card } from "./ui";

export type BarItem = { id: number; name: string; value: number; display?: string };

/** Ranked horizontal bars for a single measure, each in its player's colour. */
export function BarList({ title, items }: { title: string; items: BarItem[] }) {
  const sorted = [...items].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const max = Math.max(...sorted.map((i) => i.value), 0);

  return (
    <Card className="p-5">
      <h3 className="eyebrow mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {sorted.map((item) => (
          <li key={item.id} title={`${item.name}: ${item.display ?? item.value}`}>
            <div className="mb-1 flex justify-between text-sm">
              <Link href={`/players/${item.id}`} className="hover:underline underline-offset-4">{item.name}</Link>
              <span className="tabular text-muted-foreground">{item.display ?? item.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: max ? `${(item.value / max) * 100}%` : 0, background: playerColor(item.name) }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Vertical count bars, e.g. how often a player finished on each score. */
export function Histogram({ data }: { data: [number, number][] }) {
  const max = Math.max(...data.map(([, c]) => c), 1);
  return (
    <div className="flex h-48 items-end gap-1.5">
      {data.map(([label, count]) => (
        <div key={label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`Scored ${label}: ${count} game${count === 1 ? "" : "s"}`}>
          <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
            <span className="tabular text-xs text-muted-foreground">{count || ""}</span>
            <div
              className="w-full max-w-10 rounded-t bg-signal/80 transition-colors group-hover:bg-signal"
              style={{ height: `${(count / max) * 85}%`, minHeight: count ? 3 : 0 }}
            />
          </div>
          <span className="tabular font-mono text-[11px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
