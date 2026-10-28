import Link from "next/link";
import type { ReactNode } from "react";
import { initials, playerColor } from "@/lib/format";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "signal" }: { children: ReactNode; tone?: "signal" | "outline" }) {
  return tone === "signal" ? (
    <span className="inline-flex items-center rounded-md bg-signal px-2 py-0.5 font-mono text-xs text-signal-foreground">
      {children}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-muted font-mono text-muted-foreground ${
        size === "lg" ? "size-14 text-base" : "size-7 text-[10px]"
      }`}
      style={{ boxShadow: `inset 0 0 0 ${size === "lg" ? 2 : 1.5}px ${playerColor(name)}` }}
    >
      {initials(name)}
    </span>
  );
}

export function PlayerLink({ id, name }: { id: number; name: string }) {
  return (
    <Link href={`/players/${id}`} className="flex min-w-0 items-center gap-3 hover:underline underline-offset-4">
      {/* Initials are dropped on phones so the tables fit without scrolling. */}
      <span className="hidden sm:contents">
        <Avatar name={name} />
      </span>
      <span className="truncate">{name}</span>
    </Link>
  );
}

export function PageTitle({
  title,
  badge,
  children,
}: {
  title: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
        {badge}
      </div>
      {children && <div className="mt-3 max-w-xl text-muted-foreground leading-relaxed">{children}</div>}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 mt-12 flex items-end justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{children}</h2>
      {aside}
    </div>
  );
}

export function StatTile({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="eyebrow">{label}</div>
      <div className="tabular mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {detail && <div className="mt-1 text-sm text-muted-foreground">{detail}</div>}
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <Card className="px-6 py-12 text-center text-muted-foreground">
      {children}
    </Card>
  );
}

export function BonusMark({ kind }: { kind: "road" | "army" }) {
  return (
    <span
      title={kind === "road" ? "Longest Road" : "Largest Army"}
      className="inline-flex items-center rounded border border-border px-1.5 font-mono text-[10px] leading-5 text-muted-foreground"
    >
      {kind === "road" ? "LR" : "LA"}
    </span>
  );
}
