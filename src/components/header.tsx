import Link from "next/link";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 px-4 sm:h-14 sm:flex-nowrap sm:gap-6 sm:px-6">
        <Link href="/" aria-label="Catan Squared home" className="flex h-14 shrink-0 items-center gap-2.5 text-[17px] font-semibold tracking-tight">
          <Logo />
          <span aria-hidden>
            Catan<sup className="ml-px text-[11px] font-bold text-signal">2</sup>
          </span>
        </Link>
        {/* Phones: the nav drops to its own row under the logo. */}
        <div className="order-last -mt-2 w-full min-w-0 pb-2 sm:order-none sm:mt-0 sm:w-auto sm:pb-0">
          <NavLinks />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/games/new"
            className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add game
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
