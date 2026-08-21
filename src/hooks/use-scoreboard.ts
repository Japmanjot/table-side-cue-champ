import { useCallback, useMemo, useState } from "react";
import { ballValue, type BallKey, type GameMode } from "@/lib/game";

type Action =
  | { kind: "pot"; ball: BallKey; points: number; striker: 0 | 1 }
  | { kind: "foul"; points: number; striker: 0 | 1; label: string }
  | { kind: "switch"; striker: 0 | 1 };

export type FrameState = {
  scores: [number, number];
  striker: 0 | 1;
  breakPoints: number;
  highBreaks: [number, number];
};

const initial = (): FrameState => ({
  scores: [0, 0],
  striker: 0,
  breakPoints: 0,
  highBreaks: [0, 0],
});

function reduce(state: FrameState, action: Action): FrameState {
  switch (action.kind) {
    case "pot": {
      const scores: [number, number] = [...state.scores] as [number, number];
      scores[action.striker] += action.points;
      const breakPoints = state.breakPoints + action.points;
      const highBreaks: [number, number] = [...state.highBreaks] as [number, number];
      highBreaks[action.striker] = Math.max(highBreaks[action.striker], breakPoints);
      return { ...state, scores, breakPoints, highBreaks };
    }
    case "foul": {
      const other = (action.striker === 0 ? 1 : 0) as 0 | 1;
      const scores: [number, number] = [...state.scores] as [number, number];
      scores[other] += action.points;
      return { ...state, scores, breakPoints: 0, striker: other };
    }
    case "switch":
      return { ...state, striker: (action.striker === 0 ? 1 : 0) as 0 | 1, breakPoints: 0 };
  }
}

export function useScoreboard(mode: GameMode) {
  const [history, setHistory] = useState<Action[]>([]);

  const state = useMemo(() => history.reduce(reduce, initial()), [history]);

  const pot = useCallback(
    (ball: BallKey) => {
      setHistory((h) => {
        const s = h.reduce(reduce, initial());
        return [...h, { kind: "pot", ball, points: ballValue(ball, mode), striker: s.striker }];
      });
    },
    [mode],
  );

  const foul = useCallback((points: number, label: string) => {
    setHistory((h) => {
      const s = h.reduce(reduce, initial());
      return [...h, { kind: "foul", points, striker: s.striker, label }];
    });
  }, []);

  const switchTurn = useCallback(() => {
    setHistory((h) => {
      const s = h.reduce(reduce, initial());
      return [...h, { kind: "switch", striker: s.striker }];
    });
  }, []);

  const undo = useCallback(() => setHistory((h) => h.slice(0, -1)), []);
  const reset = useCallback(() => setHistory([]), []);

  const lastLabel = useMemo(() => {
    const last = history[history.length - 1];
    if (!last) return null;
    if (last.kind === "pot") return `${last.ball} +${last.points}`;
    if (last.kind === "foul") return `${last.label} +${last.points}`;
    return "switch turn";
  }, [history]);

  return { state, pot, foul, switchTurn, undo, reset, canUndo: history.length > 0, lastLabel };
}
