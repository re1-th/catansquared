import "server-only";

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
  return query;
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  globalForDb.catanDb ??= init();
  const run = await globalForDb.catanDb;
  return (await run(text, params)) as T[];
}
