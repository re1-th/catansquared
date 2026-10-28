"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/", label: "Rankings" },
  { href: "/games", label: "Games" },
  { href: "/stats", label: "Stats" },
  { href: "/players", label: "Players" },
  { href: "/leagues", label: "Leagues" },
];

function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/games/new");
}

function Links({ pathname }: { pathname: string | null }) {
  return (
    <nav className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {LINKS.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-md px-2 py-1 text-sm transition-colors ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveLinks() {
  return <Links pathname={usePathname()} />;
}

// The pathname is only known at request time, so the static shell renders the links unhighlighted.
export function NavLinks() {
  return (
    <Suspense fallback={<Links pathname={null} />}>
      <ActiveLinks />
    </Suspense>
  );
}
