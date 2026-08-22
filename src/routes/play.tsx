import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, RotateCcw, Repeat, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useScoreboard } from "@/hooks/use-scoreboard";
import {
  fetchMatch,
  fetchPlayers,
  saveFrame,
  updateMatch,
  type Match,
  type Player,
} from "@/lib/db";
import {
  BALLS,
  RACE_FOUL_OTHER,
  RACE_FOUL_RED,
  STANDARD_FOULS,
  ballValue,
  framesToWin,
  maxPoints,
  modeLabel,
  pointsRemaining,
} from "@/lib/game";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  validateSearch: (search: Record<string, unknown>) => ({
    matchId: String(search["matchId"] ?? ""),
  }),
  head: () => ({
    meta: [
      { title: "Live Frame — Cue Room Scoreboard" },
      {
        name: "description",
        content:
          "Live snooker scoring: ball taps, break counter, fouls, undo and race-to-target progress.",
      },
      { property: "og:title", content: "Live Frame — Cue Room Scoreboard" },
      { property: "og:description", content: "Tap balls to score the frame at the table." },
    ],
  }),
  component: PlayPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-center">Match not found.</div>,
});

type Result = { kind: "frame" | "match"; winnerIdx: 0 | 1 };

function PlayPage() {
  const { matchId } = Route.useSearch();
  const navigate = useNavigate();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => fetchMatch(matchId),
    enabled: Boolean(matchId),
  });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });

  if (isLoading || !match) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        {isLoading ? "Racking up…" : "Match not found."}
      </div>
    );
  }

  const p1 = players.find((p) => p.id === match.player1_id);
  const p2 = players.find((p) => p.id === match.player2_id);
  if (!p1 || !p2) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading players…
      </div>
    );
  }

  return <Board key={match.id} match={match} p1={p1} p2={p2} onExit={() => navigate({ to: "/" })} />;
}

function Board({
  match,
  p1,
  p2,
  onExit,
}: {
  match: Match;
  p1: Player;
  p2: Player;
  onExit: () => void;
}) {
  const mode = match.mode;
  const target = match.target_score ?? 50;
  const names: [string, string] = [p1.name, p2.name];
  const ids: [string, string] = [p1.id, p2.id];

  const redsCount = mode === "race" ? 1 : (match.reds_count ?? 15);
  const { state, pot, foul, switchTurn, undo, reset, canUndo, lastLabel, redsRemaining, colourStep } =
    useScoreboard(mode, redsCount);
  const [frameNumber, setFrameNumber] = useState(1);
  const [frameWins, setFrameWins] = useState<[number, number]>([0, 0]);
  const [result, setResult] = useState<Result | null>(null);
  const closing = useRef(false);

  const needed = framesToWin(match.best_of);

  const endFrame = useCallback(
    async (winnerIdx: 0 | 1) => {
      if (closing.current) return;
      closing.current = true;
      const wins: [number, number] = [...frameWins] as [number, number];
      wins[winnerIdx] += 1;
      const matchOver = mode === "race" || wins[winnerIdx] >= needed;

      try {
        await saveFrame({
          match_id: match.id,
          frame_number: frameNumber,
          player1_score: state.scores[0],
          player2_score: state.scores[1],
          player1_high_break: state.highBreaks[0],
          player2_high_break: state.highBreaks[1],
          winner_id: ids[winnerIdx],
        });
        await updateMatch(match.id, {
          player1_frames: wins[0],
          player2_frames: wins[1],
          ...(matchOver
            ? { winner_id: ids[winnerIdx], completed_at: new Date().toISOString() }
            : {}),
        });
      } catch (error) {
        toast.error((error as Error).message);
      }

      setFrameWins(wins);
      setResult({ kind: matchOver ? "match" : "frame", winnerIdx });
      closing.current = false;
    },
    [frameWins, frameNumber, ids, match.id, mode, needed, state.highBreaks, state.scores],
  );

  // Race mode auto-finish
  useEffect(() => {
    if (mode !== "race" || result) return;
    if (state.scores[0] >= target) void endFrame(0);
    else if (state.scores[1] >= target) void endFrame(1);
  }, [mode, result, state.scores, target, endFrame]);

  const nextFrame = () => {
    reset();
    setFrameNumber((n) => n + 1);
    setResult(null);
  };

  const leader: 0 | 1 = state.scores[0] >= state.scores[1] ? 0 : 1;

  return (
    <div className="min-h-screen pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/" className="underline-offset-4 hover:underline">
          Exit
        </Link>
        <span>
          {modeLabel(mode)}
          {mode === "race"
            ? ` · Target ${target}`
            : match.best_of > 1
              ? ` · Best of ${match.best_of} · Frame ${frameNumber}`
              : " · Single frame"}
        </span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 px-3">
        {([0, 1] as const).map((i) => (
          <button
            key={i}
            onClick={() => {
              if (state.striker !== i) switchTurn();
            }}
            className={cn(
              "rounded-3xl border border-border bg-card p-4 text-left transition-all",
              state.striker === i && "felt-panel border-gold shadow-[0_0_0_2px_var(--gold)]",
            )}
          >
            <span className="block truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {names[i]}
            </span>
            <span className="score-digits mt-1 block text-6xl">{state.scores[i]}</span>
            {mode === "standard" && match.best_of > 1 ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                Frames {frameWins[i]}/{needed}
              </span>
            ) : null}
            {mode === "race" ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                {state.scores[i]}/{target}
              </span>
            ) : null}
            {state.striker === i ? (
              <span className="mt-2 inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-gold-foreground">
                At the table
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Race HUD */}
      {mode === "race" ? (
        <div className="mt-3 px-3">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>Race to {target}</span>
              <span className="text-gold">
                {names[state.striker]} {state.scores[state.striker]}/{target}
              </span>
            </div>
            {([0, 1] as const).map((i) => (
              <div key={i} className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate">{names[i]}</span>
                  <span className="text-muted-foreground">
                    {Math.max(0, target - state.scores[i])} to go
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-felt-light transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, (state.scores[i] / target) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Break */}
      <div className="mt-3 flex items-center justify-between px-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Break</span>
          <span className="score-digits ml-3 text-3xl text-gold">{state.breakPoints}</span>
        </div>
        <Button
          variant="secondary"
          className="h-12 rounded-2xl px-4 font-semibold"
          onClick={switchTurn}
        >
          <Repeat className="mr-2 h-5 w-5" />
          Switch turn
        </Button>
      </div>

      {/* Table tracker */}
      {mode === "standard" ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2 mx-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span>
            Reds left <span className="score-digits ml-1 text-xl text-gold">{redsRemaining}</span>
          </span>
          <span>
            On table{" "}
            <span className="score-digits ml-1 text-xl text-gold">
              {pointsRemaining(redsRemaining, colourStep)}
            </span>
            <span className="ml-1 normal-case tracking-normal">of {maxPoints(redsCount)}</span>
          </span>
        </div>
      ) : null}

      {/* Ball bar */}
      <div className="mt-4 grid grid-cols-4 gap-2 px-3">
        {BALLS.map((ball) => {
          const redDone = mode === "standard" && ball.key === "red" && redsRemaining === 0;
          return (
            <button
              key={ball.key}
              onClick={() => pot(ball.key)}
              disabled={redDone}
              className="flex h-20 flex-col items-center justify-center rounded-2xl border border-border bg-card active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100"
            >
              <span
                className="h-9 w-9 rounded-full border border-black/30 shadow-inner"
                style={{ backgroundColor: ball.swatch }}
              />
              <span className="mt-1 text-sm font-bold">
                {redDone ? "Done" : `+${ballValue(ball.key, mode)}`}
              </span>
            </button>
          );
        })}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex h-20 flex-col items-center justify-center rounded-2xl border border-border bg-secondary text-sm font-semibold disabled:opacity-40"
        >
          <RotateCcw className="h-6 w-6" />
          Undo
        </button>
      </div>

      {lastLabel ? (
        <p className="mt-2 px-4 text-center text-xs text-muted-foreground">Last: {lastLabel}</p>
      ) : null}

      {/* Fouls */}
      <div className="mt-4 px-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Fouls — deducted from {names[state.striker]}
        </p>
        {mode === "race" ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="destructive"
              className="h-16 rounded-2xl text-base font-bold"
              onClick={() => foul(RACE_FOUL_RED, "red foul")}
            >
              −{RACE_FOUL_RED} Red foul
            </Button>
            <Button
              variant="destructive"
              className="h-16 rounded-2xl text-base font-bold"
              onClick={() => foul(RACE_FOUL_OTHER, "other foul")}
            >
              −{RACE_FOUL_OTHER} Other foul
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {STANDARD_FOULS.map((n) => (
              <Button
                key={n}
                variant="destructive"
                className="h-16 rounded-2xl text-base font-bold"
                onClick={() => foul(n, `foul ${n}`)}
              >
                −{n}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Frame controls */}
      <div className="mt-5 grid grid-cols-2 gap-2 px-3 pb-8">
        <Button
          variant="secondary"
          className="h-14 rounded-2xl font-semibold"
          onClick={() => void endFrame(leader)}
        >
          <Flag className="mr-2 h-5 w-5" />
          End frame
        </Button>
        <Button
          variant="secondary"
          className="h-14 rounded-2xl font-semibold text-destructive"
          onClick={() => void endFrame((state.striker === 0 ? 1 : 0) as 0 | 1)}
        >
          Concede
        </Button>
      </div>

      {result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-6 animate-in fade-in">
          <div className="felt-panel w-full max-w-sm rounded-3xl p-8 text-center">
            <Trophy className="mx-auto h-14 w-14 text-gold" />
            <h2 className="display mt-4 text-4xl uppercase">
              {result.kind === "match" ? "Match won" : "Frame won"}
            </h2>
            <p className="display mt-1 text-3xl text-gold">{names[result.winnerIdx]}</p>
            <p className="mt-3 text-lg font-semibold">
              {state.scores[0]} – {state.scores[1]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Highest breaks: {names[0]} {state.highBreaks[0]} · {names[1]} {state.highBreaks[1]}
            </p>
            <div className="mt-6 space-y-2">
              {result.kind === "frame" ? (
                <Button className="h-14 w-full rounded-2xl text-base font-semibold" onClick={nextFrame}>
                  Next frame
                </Button>
              ) : null}
              <Button
                variant="secondary"
                className="h-14 w-full rounded-2xl text-base font-semibold"
                onClick={onExit}
              >
                Back to setup
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
