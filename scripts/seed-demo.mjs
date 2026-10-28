// Fills the LOCAL embedded database (.data/pglite) with made-up games so the site
// can be previewed without Neon. Stop `npm run dev` before running: npm run seed:demo
// It never touches Neon and refuses to run when DATABASE_URL is set.
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  console.error("DATABASE_URL is set; the demo seed only writes to the local database.");
  process.exit(1);
}

mkdirSync("./.data", { recursive: true });
const db = new PGlite("./.data/pglite");

// Same tables as src/lib/db.ts.
await db.exec(`
  CREATE TABLE IF NOT EXISTS players (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS games (id SERIAL PRIMARY KEY, played_on DATE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS game_players (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id),
    score INTEGER NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT false,
    longest_road BOOLEAN NOT NULL DEFAULT false,
    largest_army BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (game_id, player_id)
  );
  TRUNCATE game_players, games, players RESTART IDENTITY CASCADE;
`);

// Same list and order as src/lib/players.ts.
const names = ["Revanth", "Harish", "Bhamini", "Somak", "Bisht", "Rajdeep"];
const allIds = names.map((_, i) => i + 1);
for (const name of names) await db.query("INSERT INTO players (name) VALUES ($1)", [name]);

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const day = new Date("2026-07-01T00:00:00Z");
for (let g = 0; g < 34; g++) {
  day.setUTCDate(day.getUTCDate() + 1 + Math.floor(rand() * 4));
  const ids = allIds.filter(() => rand() > 0.3);
  while (ids.length < 3) ids.push(allIds.find((id) => !ids.includes(id)));
  const winner = pick(ids);
  const road = rand() > 0.15 ? pick(ids) : null;
  const army = rand() > 0.25 ? pick(ids) : null;
  const [{ id }] = (await db.query("INSERT INTO games (played_on) VALUES ($1) RETURNING id", [day.toISOString().slice(0, 10)])).rows;
  for (const p of ids) {
    const score = p === winner ? 11 : 4 + Math.floor(rand() * 6);
    await db.query(
      "INSERT INTO game_players VALUES ($1, $2, $3, $4, $5, $6)",
      [id, p, score, p === winner, p === road, p === army],
    );
  }
}

console.log(`Seeded ${names.length} players and 34 demo games into .data/pglite`);
await db.close();
