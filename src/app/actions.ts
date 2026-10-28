"use server";

import { updateTag } from "next/cache";
import { query } from "@/lib/db";
import { DATA_TAG } from "@/lib/data";
import type { GameInput } from "@/lib/types";

export type ActionResult = { error: string } | { ok: true };

/** Turns a database failure into a message the form can show, instead of crashing the page. */
function failure(err: unknown): { error: string } {
  console.error(err);
  const detail = err instanceof Error ? err.message : String(err);
  return { error: `Couldn't save: ${detail}` };
}

function validate(input: GameInput): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.playedOn) || Number.isNaN(Date.parse(input.playedOn))) {
    return "Pick a valid date.";
  }
  const { results } = input;
  if (results.length < 2) return "A game needs at least 2 players.";
  if (new Set(results.map((r) => r.playerId)).size !== results.length) {
    return "Each player can only appear once.";
  }
  if (results.some((r) => !Number.isInteger(r.score) || r.score < 0 || r.score > 30)) {
    return "Scores must be whole numbers between 0 and 30.";
  }
  if (results.filter((r) => r.isWinner).length !== 1) return "Pick exactly one winner.";
  if (results.filter((r) => r.longestRoad).length > 1) return "Only one player can hold Longest Road.";
  if (results.filter((r) => r.largestArmy).length > 1) return "Only one player can hold Largest Army.";
  return null;
}

function resultColumns(input: GameInput) {
  const r = input.results;
  return [
    r.map((x) => x.playerId),
    r.map((x) => x.score),
    r.map((x) => x.isWinner),
    r.map((x) => x.longestRoad),
    r.map((x) => x.largestArmy),
  ];
}

const RESULTS_FROM_ARRAYS = `unnest($2::int[], $3::int[], $4::bool[], $5::bool[], $6::bool[])
  AS x(player_id, score, is_winner, longest_road, largest_army)`;

export async function addGame(input: GameInput): Promise<ActionResult> {
  const error = validate(input);
  if (error) return { error };

  try {
    await query(
      `WITH g AS (INSERT INTO games (played_on) VALUES ($1) RETURNING id)
       INSERT INTO game_players (game_id, player_id, score, is_winner, longest_road, largest_army)
       SELECT g.id, x.player_id, x.score, x.is_winner, x.longest_road, x.largest_army
       FROM g, ${RESULTS_FROM_ARRAYS}`,
      [input.playedOn, ...resultColumns(input)],
    );
  } catch (err) {
    return failure(err);
  }
  updateTag(DATA_TAG);
  return { ok: true };
}

export async function updateGame(id: number, input: GameInput): Promise<ActionResult> {
  const error = validate(input);
  if (error) return { error };

  let rows;
  try {
    rows = await query(
      `WITH g AS (UPDATE games SET played_on = $1 WHERE id = $7 RETURNING id),
       removed AS (DELETE FROM game_players WHERE game_id = $7 AND player_id <> ALL($2::int[]))
       INSERT INTO game_players (game_id, player_id, score, is_winner, longest_road, largest_army)
       SELECT g.id, x.player_id, x.score, x.is_winner, x.longest_road, x.largest_army
       FROM g, ${RESULTS_FROM_ARRAYS}
       ON CONFLICT (game_id, player_id) DO UPDATE SET
         score = EXCLUDED.score,
         is_winner = EXCLUDED.is_winner,
         longest_road = EXCLUDED.longest_road,
         largest_army = EXCLUDED.largest_army
       RETURNING game_id`,
      [input.playedOn, ...resultColumns(input), id],
    );
  } catch (err) {
    return failure(err);
  }
  if (rows.length === 0) return { error: "That game no longer exists." };
  updateTag(DATA_TAG);
  return { ok: true };
}

export async function deleteGame(id: number): Promise<ActionResult> {
  try {
    await query("DELETE FROM games WHERE id = $1", [id]);
  } catch (err) {
    return failure(err);
  }
  updateTag(DATA_TAG);
  return { ok: true };
}
