import { describe, expect, it } from "vitest";
import { computeLeagues } from "./league";
import { highlights, playerStats } from "./stats";
import type { Game, Player } from "./types";

const players: Player[] = [
  { id: 1, name: "Ana" },
  { id: 2, name: "Ben" },
  { id: 3, name: "Cal" },
];

type Row = [id: number, score: number, flags?: string];

/** flags: "W" winner, "R" Longest Road, "A" Largest Army. */
function game(n: number, rows: Row[]): Game {
  return {
    id: n,
    number: n,
    playedOn: `2026-02-${String(n).padStart(2, "0")}`,
    results: rows.map(([playerId, score, flags = ""]) => ({
      playerId,
      score,
      isWinner: flags.includes("W"),
      longestRoad: flags.includes("R"),
      largestArmy: flags.includes("A"),
    })),
  };
}

function run(games: Game[]) {
  const leagues = computeLeagues(games, players.map((p) => p.id));
  const stats = playerStats(players, games, leagues);
  const list = highlights(games, stats, leagues);
  return (label: string) => list.find((h) => h.label === label)!;
}

const games = [
  game(1, [[1, 10, "WRA"], [2, 9], [3, 4]]), // Ana by 1; Ben second; Cal last; Ana double whammy
  game(2, [[1, 5], [2, 10, "WR"], [3, 5]]), // Ben by 5; Ana & Cal tie for both second and last
  game(3, [[1, 3], [2, 10, "W"], [3, 2]]), // losers average 2.5
  game(4, [[1, 7], [2, 6, "R"], [3, 10, "W"]]), // Ben takes LR from Ana (2 vs 1)
];

describe("highlights", () => {
  it("counts second and last places, sharing ties", () => {
    const h = run(games);
    // Second: Ben (g1), Ana & Cal (g2), Ana (g3), Ana (g4) -> Ana 3.
    expect(h("Bridesmaid")).toMatchObject({ value: "3", detail: "Ana · second places" });
    // Last: Cal (g1), Ana & Cal (g2), Cal (g3), Ben (g4) -> Cal 3.
    expect(h("Wooden spoon")).toMatchObject({ value: "3", detail: "Cal · last places" });
  });

  it("finds one-point wins, the most one-sided game and double whammies", () => {
    const h = run(games);
    expect(h("Photo finish")).toMatchObject({ value: "1", detail: "Ana · wins by 1 point" });
    expect(h("Most one-sided game")).toMatchObject({ value: "2.5 avg", detail: "Losers' average in game 3, won by Ben" });
    expect(h("Double whammy")).toMatchObject({ value: "1", detail: "Ana · games with both LR & LA" });
  });

  it("counts bonus steals and current droughts", () => {
    const h = run(games);
    expect(h("Bonus thief")).toMatchObject({ value: "1", detail: "Ben · times taking LR/LA from the holder" });
    // Since their last win: Ana 3 games, Ben 1, Cal 0.
    expect(h("Longest drought")).toMatchObject({ value: "3", detail: "Ana · games since a win" });
  });

  it("lists everyone tied for the lead", () => {
    const h = run([game(1, [[1, 10, "W"], [2, 9], [3, 9]])]);
    expect(h("Bridesmaid").detail).toBe("Ben & Cal · second places");
  });
});
