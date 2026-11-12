import { describe, expect, it } from "vitest";
import { computeLeagues } from "./league";
import type { Game } from "./types";

const A = 1, B = 2, C = 3;
// Most tests check tie-breaks and hand-overs, so the bonus counts from its first take.
const FIRST_TAKE = { longestRoad: 1, largestArmy: 1 };
const PLAYERS = [A, B, C];

type Spec = { win: number; lr?: number; la?: number };

function games(specs: Spec[]): Game[] {
  return specs.map((s, i) => ({
    id: i + 1,
    number: i + 1,
    playedOn: `2026-01-${String(i + 1).padStart(2, "0")}`,
    results: PLAYERS.map((id) => ({
      playerId: id,
      score: id === s.win ? 10 : 5,
      isWinner: id === s.win,
      longestRoad: id === s.lr,
      largestArmy: id === s.la,
    })),
  }));
}

const standing = (l: ReturnType<typeof computeLeagues>[number], id: number) =>
  l.standings.find((s) => s.playerId === id)!;

describe("computeLeagues", () => {
  it("gives a point per win and 2 to each bonus leader", () => {
    const [l] = computeLeagues(games([{ win: A, lr: B, la: C }, { win: A }]), PLAYERS, FIRST_TAKE);
    expect(standing(l, A).points).toBe(2);
    expect(standing(l, B).points).toBe(2);
    expect(standing(l, C).points).toBe(2);
    expect(l.championId).toBeNull();
  });

  it("keeps a tied bonus with whoever reached the count first", () => {
    // B reaches 1 LR first, then A ties at 1: B keeps it. A then reaches 2 and takes it.
    const [l1] = computeLeagues(games([{ win: C, lr: B }, { win: C, lr: A }]), PLAYERS, FIRST_TAKE);
    expect(l1.longestRoad.holderId).toBe(B);
    const [l2] = computeLeagues(games([{ win: C, lr: B }, { win: C, lr: A }, { win: C, lr: A }]), PLAYERS, FIRST_TAKE);
    expect(l2.longestRoad.holderId).toBe(A);
    // B ties back at 2; A got to 2 first so A keeps it.
    const [l3] = computeLeagues(
      games([{ win: C, lr: B }, { win: C, lr: A }, { win: C, lr: A }, { win: C, lr: B }]),
      PLAYERS,
      FIRST_TAKE,
    );
    expect(l3.longestRoad.holderId).toBe(A);
  });

  it("only ends the league on a game win", () => {
    // A: 6 wins + Largest Army = 8. Then A takes Longest Road in a game B wins -> 10, no title.
    const specs: Spec[] = [
      { win: A, la: A }, { win: A }, { win: A }, { win: A }, { win: A }, { win: A },
      { win: B, lr: A },
    ];
    const [l] = computeLeagues(games(specs), PLAYERS, FIRST_TAKE);
    expect(standing(l, A).points).toBe(10);
    expect(l.championId).toBeNull();

    // Next A win clinches it and starts league 2.
    const leagues = computeLeagues(games([...specs, { win: A }, { win: B }]), PLAYERS, FIRST_TAKE);
    expect(leagues).toHaveLength(2);
    expect(leagues[0].championId).toBe(A);
    expect(standing(leagues[0], A).points).toBe(11);
    expect(leagues[1].games).toHaveLength(1);
    expect(standing(leagues[1], B).points).toBe(1);
    expect(standing(leagues[1], A).points).toBe(0);
  });

  it("can clinch with a bonus taken in the winning game", () => {
    // A on 6 wins + Largest Army = 8, then a win that also takes Longest Road: 7 + 2 + 2 = 11.
    const specs: Spec[] = [
      { win: A, la: A }, { win: A }, { win: A }, { win: A }, { win: A }, { win: A },
      { win: A, lr: A },
    ];
    const leagues = computeLeagues(games(specs), PLAYERS, FIRST_TAKE);
    expect(leagues[0].championId).toBe(A);
    expect(leagues).toHaveLength(2);
  });

  it("records each time a bonus changes hands", () => {
    // B takes LR, A ties (no change), A passes B, B ties back (no change).
    const [l] = computeLeagues(
      games([{ win: C, lr: B }, { win: C, lr: A }, { win: C, lr: A }, { win: C, lr: B }]),
      PLAYERS,
      FIRST_TAKE,
    );
    expect(l.longestRoad.history).toEqual([
      { gameIndex: 0, holderId: B, count: 1, fromId: null, fromCount: 0 },
      { gameIndex: 2, holderId: A, count: 2, fromId: B, fromCount: 1 },
    ]);
    expect(l.largestArmy.history).toEqual([]);
  });

  it("moves bonus points away when a holder is overtaken", () => {
    const [l] = computeLeagues(games([{ win: C, la: A }, { win: C, la: B }, { win: C, la: B }]), PLAYERS, FIRST_TAKE);
    expect(standing(l, A).points).toBe(0);
    expect(standing(l, B).points).toBe(2);
    expect(l.pointsTimeline.get(A)).toEqual([2, 2, 0]);
  });

  it("breaks ties in the table by wins, then who got there first", () => {
    // A: 2 wins. B: Longest Road (2 pts, 0 wins). A ranks above B.
    const [l] = computeLeagues(games([{ win: A, lr: B }, { win: A }]), PLAYERS, FIRST_TAKE);
    expect(l.standings.map((s) => s.playerId).slice(0, 2)).toEqual([A, B]);
    // B: 2 wins reached in game 2; A: 2 wins reached in game 4. B ranks above A.
    const [l2] = computeLeagues(games([{ win: B }, { win: B }, { win: A }, { win: A }]), PLAYERS, FIRST_TAKE);
    expect(l2.standings.map((s) => s.playerId).slice(0, 2)).toEqual([B, A]);
  });

  describe("with the league's real thresholds (5 Longest Roads, 3 Largest Armies)", () => {
    // Wins are spread out so nobody reaches 10 and ends the league mid-test.
    const roads = (n: number, player: number, win: number): Spec[] => Array.from({ length: n }, () => ({ win, lr: player }));
    const armies = (n: number, player: number, win: number): Spec[] => Array.from({ length: n }, () => ({ win, la: player }));

    it("awards nothing until someone reaches the threshold", () => {
      const [l] = computeLeagues(games([...roads(4, A, C), ...armies(2, B, C)]), PLAYERS);
      expect(l.longestRoad.holderId).toBeNull();
      expect(l.largestArmy.holderId).toBeNull();
      expect(standing(l, A).points).toBe(0);
      expect(standing(l, A).longestRoads).toBe(4);
    });

    it("gives the bonus to the first to reach it", () => {
      // B gets to 4 roads first, but A is first to 5.
      const [l] = computeLeagues(games([...roads(4, B, C), ...roads(5, A, B), ...armies(3, B, C)]), PLAYERS);
      expect(l.longestRoad.holderId).toBe(A);
      expect(l.largestArmy.holderId).toBe(B);
      expect(standing(l, A).points).toBe(2);
      expect(l.longestRoad.history).toEqual([{ gameIndex: 8, holderId: A, count: 5, fromId: null, fromCount: 0 }]);
    });

    it("needs one more than the holder to take it away", () => {
      // A reaches 5 first. B reaching 5 is a tie, so A keeps it; B's 6th takes it.
      const specs = [...roads(5, A, B), ...roads(5, B, C)];
      expect(computeLeagues(games(specs), PLAYERS)[0].longestRoad.holderId).toBe(A);
      const [l] = computeLeagues(games([...specs, ...roads(1, B, A)]), PLAYERS);
      expect(l.longestRoad.holderId).toBe(B);
      expect(l.longestRoad.history[1]).toMatchObject({ holderId: B, count: 6, fromId: A, fromCount: 5 });
    });
  });
});
