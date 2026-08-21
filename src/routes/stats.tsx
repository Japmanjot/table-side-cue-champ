import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchFrames, fetchMatches, fetchPlayers, type Frame, type Match } from "@/lib/db";
import type { GameMode } from "@/lib/game";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats & Head-to-Head — Cue Room Scoreboard" },
      {
        name: "description",
        content:
          "Head-to-head records, highest breaks and match totals kept separately for standard snooker and race mode.",
      },
      { property: "og:title", content: "Stats & Head-to-Head — Cue Room Scoreboard" },
      { property: "og:description", content: "Compare players and track records per game mode." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });
  const { data: frames = [] } = useQuery({ queryKey: ["frames"], queryFn: fetchFrames });

  const [mode, setMode] = useState<GameMode>("standard");
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);

  useEffect(() => {
    if (players.length >= 2 && !a && !b) {
      setA(players[0]!.id);
      setB(players[1]!.id);
    }
  }, [players, a, b]);

  const modeMatches = matches.filter((m) => m.mode === mode && m.completed_at);
  const name = (id: string | null) => players.find((p) => p.id === id)?.name ?? "—";

  return (
    <AppShell title="Stats" subtitle="Standard and race records kept apart">
      <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
        <TabsList className="grid w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="race">Race Mode</TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="mt-5 space-y-6">
          <section>
            <h2 className="mb-2 text-xl uppercase">Head to head</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => (a === p.id ? undefined : b === p.id ? setB(p.id) : setA(p.id))}
                  className={cn(
                    "h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold",
                    (a === p.id || b === p.id) && "border-gold bg-accent text-gold",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <SelectPill label="Player A" value={a} players={players} onChange={setA} />
              <SelectPill label="Player B" value={b} players={players} onChange={setB} />
            </div>
            {a && b && a !== b ? (
              <HeadToHead
                aId={a}
                bId={b}
                aName={name(a)}
                bName={name(b)}
                matches={modeMatches}
                frames={frames}
              />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Pick two different players.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xl uppercase">Records</h2>
            <div className="space-y-2">
              {players.map((p) => {
                const record = playerRecord(p.id, modeMatches, frames);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                  >
                    <span className="font-semibold">{p.name}</span>
                    <span className="flex gap-5 text-right text-sm">
                      <Stat label="Wins" value={record.wins} />
                      <Stat label="Frames" value={record.frames} />
                      <Stat label="High break" value={record.highBreak} />
                      <Stat label="Avg score" value={record.avg} />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="block">
      <span className="score-digits block text-2xl text-gold">{value}</span>
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

function SelectPill({
  label,
  value,
  players,
  onChange,
}: {
  label: string;
  value: string | null;
  players: { id: string; name: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex-1 rounded-xl border border-border bg-card p-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full bg-transparent text-base font-semibold text-foreground outline-none"
      >
        {players.map((p) => (
          <option key={p.id} value={p.id} className="bg-card">
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function playerRecord(playerId: string, matches: Match[], frames: Frame[]) {
  const mine = matches.filter((m) => m.player1_id === playerId || m.player2_id === playerId);
  const wins = mine.filter((m) => m.winner_id === playerId).length;
  const ids = new Set(mine.map((m) => m.id));
  const myFrames = frames.filter((f) => ids.has(f.match_id));
  let framesWon = 0;
  let points = 0;
  let highBreak = 0;
  for (const f of myFrames) {
    const match = mine.find((m) => m.id === f.match_id)!;
    const isP1 = match.player1_id === playerId;
    points += isP1 ? f.player1_score : f.player2_score;
    highBreak = Math.max(highBreak, isP1 ? f.player1_high_break : f.player2_high_break);
    if (f.winner_id === playerId) framesWon += 1;
  }
  return {
    wins,
    frames: framesWon,
    highBreak,
    avg: myFrames.length ? Math.round(points / myFrames.length) : 0,
  };
}

function HeadToHead({
  aId,
  bId,
  aName,
  bName,
  matches,
  frames,
}: {
  aId: string;
  bId: string;
  aName: string;
  bName: string;
  matches: Match[];
  frames: Frame[];
}) {
  const h2h = matches.filter(
    (m) =>
      (m.player1_id === aId && m.player2_id === bId) ||
      (m.player1_id === bId && m.player2_id === aId),
  );
  const a = playerRecord(aId, h2h, frames);
  const b = playerRecord(bId, h2h, frames);

  return (
    <div className="mt-3 felt-panel rounded-2xl p-4">
      <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
        {h2h.length} matches
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4 text-center">
        {[
          { name: aName, r: a },
          { name: bName, r: b },
        ].map(({ name, r }) => (
          <div key={name}>
            <p className="truncate text-sm font-semibold uppercase tracking-wide">{name}</p>
            <p className="score-digits text-5xl text-gold">{r.wins}</p>
            <p className="text-xs text-muted-foreground">wins</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Frames {r.frames} · Avg {r.avg} · Best break {r.highBreak}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
