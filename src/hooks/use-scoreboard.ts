import { useCallback, useMemo, useState } from "react";
import { ballValue, type BallKey, type GameMode } from "@/lib/game";

type Action =
  | { kind: "pot"; ball: BallKey; points: number; striker: number }
  | { kind: "foul"; points: number; striker: number; label: string }
  | { kind: "switch"; striker: number };

export type FrameState = {
  scores: number[];
  striker: number;
  breakPoints: number;
  highBreaks: number[];
};

const initial = (count: number): FrameState => ({
  scores: Array.from({ length: count }, () => 0),
  striker: 0,
  breakPoints: 0,
  highBreaks: Array.from({ length: count }, () => 0),
});

function makeReduce(count: number) {
  const next = (i: number) => (i + 1) % count;
  return function reduce(state: FrameState, action: Action): FrameState {
    switch (action.kind) {
      case "pot": {
        const scores = [...state.scores];
        scores[action.striker] = (scores[action.striker] ?? 0) + action.points;
        const breakPoints = state.breakPoints + action.points;
        const highBreaks = [...state.highBreaks];
        highBreaks[action.striker] = Math.max(highBreaks[action.striker] ?? 0, breakPoints);
        return { ...state, scores, breakPoints, highBreaks };
      }
      case "foul": {
        const scores = [...state.scores];
        scores[action.striker] = (scores[action.striker] ?? 0) - action.points;
        return { ...state, scores, breakPoints: 0, striker: next(action.striker) };
      }
      case "switch":
        return { ...state, striker: next(action.striker), breakPoints: 0 };
    }
  };
}

export function useScoreboard(mode: GameMode, redsCount = 15, playerCount = 2) {
  const [history, setHistory] = useState<Action[]>([]);

  const reduce = useMemo(() => makeReduce(playerCount), [playerCount]);
  const state = useMemo(
    () => history.reduce(reduce, initial(playerCount)),
    [history, reduce, playerCount],
  );

  const redsPotted = useMemo(
    () =>
      mode === "standard"
        ? history.filter((a) => a.kind === "pot" && a.ball === "red").length
        : 0,
    [history, mode],
  );
  const redsRemaining = Math.max(0, redsCount - redsPotted);

  /** Colours potted after the last red is gone (clearance progress). */
  const colourStep = useMemo(() => {
    if (mode !== "standard" || redsRemaining > 0) return 0;
    let seenReds = 0;
    let step = 0;
    for (const a of history) {
      if (a.kind !== "pot") continue;
      if (a.ball === "red") {
        seenReds += 1;
        step = 0;
      } else if (seenReds >= redsCount) {
        step += 1;
      }
    }
    return Math.min(6, step);
  }, [history, mode, redsCount, redsRemaining]);

  const pot = useCallback(
    (ball: BallKey) => {
      setHistory((h) => {
        const s = h.reduce(reduce, initial(playerCount));
        return [...h, { kind: "pot", ball, points: ballValue(ball, mode), striker: s.striker }];
      });
    },
    [mode, reduce, playerCount],
  );

  const foul = useCallback(
    (points: number, label: string) => {
      setHistory((h) => {
        const s = h.reduce(reduce, initial(playerCount));
        return [...h, { kind: "foul", points, striker: s.striker, label }];
      });
    },
    [reduce, playerCount],
  );

  const switchTurn = useCallback(() => {
    setHistory((h) => {
      const s = h.reduce(reduce, initial(playerCount));
      return [...h, { kind: "switch", striker: s.striker }];
    });
  }, [reduce, playerCount]);

  const undo = useCallback(() => setHistory((h) => h.slice(0, -1)), []);
  const reset = useCallback(() => setHistory([]), []);

  const lastLabel = useMemo(() => {
    const last = history[history.length - 1];
    if (!last) return null;
    if (last.kind === "pot") return `${last.ball} +${last.points}`;
    if (last.kind === "foul") return `${last.label} −${last.points}`;
    return "switch turn";
  }, [history]);

  return {
    state,
    pot,
    foul,
    switchTurn,
    undo,
    reset,
    canUndo: history.length > 0,
    lastLabel,
    redsRemaining,
    colourStep,
  };
}
