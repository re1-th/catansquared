# Catan² (Catan Squared)

Standings, game history and stats for our Catan league. Next.js on Vercel, data in Neon Postgres.

## The rules

- **1 point** for every game you win.
- **2 points** for whoever has taken Longest Road the most times this league.
- **2 points** for whoever has taken Largest Army the most times this league.
- On a tie for most Longest Roads / Largest Armies, the 2 points stay with whoever reached that count first. They only move when someone strictly overtakes.
- **First to 10 wins the league, but only on a game win.** Reaching 10 through a bonus doesn't end it; you still need to win a game while on 10 or more.
- The next game after a league is won starts a new league with everyone on 0.

Leagues aren't stored. They're worked out from the game history every time (`src/lib/league.ts`), so editing or deleting an old game recalculates everything after it, including past champions.

## Pages

| Page | What's on it |
|---|---|
| `/` Rankings | Current league table, leaders card, points race chart, recent games |
| `/games` | Every game; edit and delete |
| `/games/new` | Log a game; add new players inline |
| `/stats` | All-time stats across every league |
| `/players`, `/players/[id]` | Player cards and per-player stats |
| `/leagues` | Finished leagues and their champions |

## Deploying to Vercel with Neon

1. The code lives at https://github.com/re1-th/catansquared.
2. In Vercel: **Add New → Project**, import the repository, and deploy. The defaults are fine.
3. In the project, open **Storage → Create Database → Neon** (Vercel Marketplace), create it on the free plan, and connect it to the project for all environments. This adds `DATABASE_URL` to the project's environment variables.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the build picks up the database.

That's it. The tables are created automatically on first use. Add players from the **Add game** page.

## Running locally

```bash
npm install
npm run dev
```

Without `DATABASE_URL` the app uses an embedded Postgres stored in `.data/` (git-ignored), so nothing needs setting up. To fill it with made-up games for a preview, stop the dev server and run `npm run seed:demo` (it wipes the local database first and refuses to run against Neon).

To work against the real Neon database instead, link the project with the Vercel CLI and pull its env vars into `.env.local`:

```bash
npx vercel link
npx vercel env pull .env.local
```

## Checks

```bash
npm test        # league rule tests
npm run lint
npm run build
```
