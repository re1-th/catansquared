import "server-only";
import { PLAYER_NAMES } from "./players";

type Row = Record<string, unknown>;
type QueryFn = (text: string, params?: unknown[]) => Promise<Row[]>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    played_on DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS game_players (
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id),
    score INTEGER NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT false,
    longest_road BOOLEAN NOT NULL DEFAULT false,
    largest_army BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (game_id, player_id)
  )`,
];

// Neon in production (the Vercel integration sets DATABASE_URL, or POSTGRES_URL on older setups);
// an embedded Postgres on disk for local development without one.
async function createQuery(): Promise<QueryFn> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return (text, params = []) => sql.query(text, params) as Promise<Row[]>;
  }
  // Vercel's filesystem is read-only and per-instance, so the local fallback can never work there.
  if (process.env.VERCEL) {
    throw new Error(
      "No database is connected: DATABASE_URL is not set. Connect Neon to the Vercel project (Storage tab), then redeploy.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./.data", { recursive: true });
  const local = new PGlite("./.data/pglite");
  return async (text, params = []) => (await local.query<Row>(text, params)).rows;
}

const globalForDb = globalThis as unknown as { catanDb?: Promise<QueryFn> };

async function init(): Promise<QueryFn> {
  const query = await createQuery();
  for (const statement of SCHEMA) await query(statement);
  await query(
    `INSERT INTO players (name)
     SELECT name FROM unnest($1::text[]) WITH ORDINALITY AS t(name, n) ORDER BY n
     ON CONFLICT (name) DO NOTHING`,
    [PLAYER_NAMES],
  );
  return query;
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  // Forget a failed connection so the next request retries instead of failing forever.
  globalForDb.catanDb ??= init().catch((err) => {
    globalForDb.catanDb = undefined;
    throw err;
  });
  const run = await globalForDb.catanDb;
  return (await run(text, params)) as T[];
}
