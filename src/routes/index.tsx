import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Minus, Plus, Play } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { createMatch, fetchPlayers, type Player } from "@/lib/db";
import { maxPoints, REDS_OPTIONS, type GameMode, type RedsCount } from "@/lib/game";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Match — Cue Room Scoreboard" },
      {
        name: "description",
        content:
          "Pick two strikers, choose standard snooker or race-to-target mode, and start scoring at the table.",
      },
      { property: "og:title", content: "New Match — Cue Room Scoreboard" },
      {
        property: "og:description",
        content: "Set up a snooker frame or a race-to-target game in two taps.",
      },
    ],
  }),
  component: Index,
});

const BEST_OF = [1, 3, 5, 7];
const TARGET_PRESETS = [50, 75, 100, 150];

function Index() {
  const navigate = useNavigate();
  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  const [p1, setP1] = useState<string | null>(null);
  const [p2, setP2] = useState<string | null>(null);
  const [p3, setP3] = useState<string | null>(null);
  const [threePlayers, setThreePlayers] = useState(false);
  const [mode, setMode] = useState<GameMode>("standard");
  const [bestOf, setBestOf] = useState(1);
  const [target, setTarget] = useState(50);
  const [reds, setReds] = useState<RedsCount>(15);

  useEffect(() => {
    if (players.length >= 2 && !p1 && !p2) {
      setP1(players[0]!.id);
      setP2(players[1]!.id);
    }
  }, [players, p1, p2]);

  const picked = [p1, p2, ...(threePlayers ? [p3] : [])];
  const valid =
    picked.every(Boolean) && new Set(picked).size === picked.length;

  const start = useMutation({
    mutationFn: async () => {
      if (!valid) throw new Error("Pick different players for every seat");
      return createMatch({
        mode,
        target_score: mode === "race" ? target : null,
        best_of: mode === "race" ? 1 : bestOf,
        reds_count: mode === "race" ? 1 : reds,
        player1_id: p1!,
        player2_id: p2!,
        player3_id: threePlayers ? p3 : null,
      });
    },

    onSuccess: (match) => {
      navigate({ to: "/play", search: { matchId: match.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Cue Room" subtitle="Table-side scoreboard">
      <section className="space-y-6">
        <div>
          <Label>Players</Label>
          <div className="grid grid-cols-2 gap-2">
            <Chip active={!threePlayers} onClick={() => setThreePlayers(false)}>
              2 Players
            </Chip>
            <Chip active={threePlayers} onClick={() => setThreePlayers(true)}>
              3 Players
            </Chip>
          </div>
        </div>

        <PlayerPicker
          label="Striker 1"
          players={players}
          value={p1}
          onChange={setP1}
          taken={[p2, threePlayers ? p3 : null]}
          loading={isLoading}
        />
        <PlayerPicker
          label="Striker 2"
          players={players}
          value={p2}
          onChange={setP2}
          taken={[p1, threePlayers ? p3 : null]}
          loading={isLoading}
        />
        {threePlayers ? (
          <PlayerPicker
            label="Striker 3"
            players={players}
            value={p3}
            onChange={setP3}
            taken={[p1, p2]}
            loading={isLoading}
          />
        ) : null}


        <div>
          <Label>Game mode</Label>
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              active={mode === "standard"}
              onClick={() => setMode("standard")}
              title="Standard"
              detail={`${reds} reds + colours, ${maxPoints(reds)} max`}
            />
            <ModeCard
              active={mode === "race"}
              onClick={() => setMode("race")}
              title="Race Mode"
              detail="1 red (10 pts) + colours"
            />
          </div>
        </div>

        {mode === "standard" ? (
          <>
            <div>
              <Label>Reds count</Label>
              <div className="grid grid-cols-3 gap-2">
                {REDS_OPTIONS.map((n) => (
                  <Chip key={n} active={reds === n} onClick={() => setReds(n)}>
                    {n} Reds
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Max break {maxPoints(reds)} pts
              </p>
            </div>
            <div>
              <Label>Match length</Label>
              <div className="grid grid-cols-4 gap-2">
                {BEST_OF.map((n) => (
                  <Chip key={n} active={bestOf === n} onClick={() => setBestOf(n)}>
                    {n === 1 ? "Single" : `Bo${n}`}
                  </Chip>
                ))}
              </div>
            </div>
          </>

        ) : (
          <div>
            <Label>Target score</Label>
            <div className="felt-panel flex items-center justify-between rounded-2xl p-3">
              <Button
                variant="secondary"
                size="icon"
                className="h-14 w-14 rounded-xl"
                onClick={() => setTarget((t) => Math.max(10, t - 10))}
                aria-label="Decrease target by 10"
              >
                <Minus className="h-6 w-6" />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(Math.max(10, Number(e.target.value) || 0))}
                className="score-digits w-28 bg-transparent text-center text-5xl text-gold outline-none"
                aria-label="Target score"
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-14 w-14 rounded-xl"
                onClick={() => setTarget((t) => t + 10)}
                aria-label="Increase target by 10"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {TARGET_PRESETS.map((n) => (
                <Chip key={n} active={target === n} onClick={() => setTarget(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <Button
          className="h-16 w-full rounded-2xl text-lg font-semibold"
          disabled={!p1 || !p2 || p1 === p2 || start.isPending}
          onClick={() => start.mutate()}
        >
          <Play className="mr-2 h-5 w-5" />
          Start match
        </Button>
      </section>
    </AppShell>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl border border-border bg-card text-base font-semibold transition-colors",
        active && "border-gold bg-accent text-gold",
      )}
    >
      {children}
    </button>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border bg-card p-4 text-left transition-colors",
        active && "border-gold bg-accent",
      )}
    >
      <span className="display block text-2xl uppercase">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
    </button>
  );
}

function PlayerPicker({
  label,
  players,
  value,
  onChange,
  disabledId,
  loading,
}: {
  label: string;
  players: Player[];
  value: string | null;
  onChange: (id: string) => void;
  disabledId: string | null;
  loading: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {loading ? (
        <div className="h-12 animate-pulse rounded-xl bg-card" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              disabled={p.id === disabledId}
              onClick={() => onChange(p.id)}
              className={cn(
                "h-12 rounded-xl border border-border bg-card px-4 font-semibold transition-colors disabled:opacity-30",
                value === p.id && "border-gold bg-accent text-gold",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
