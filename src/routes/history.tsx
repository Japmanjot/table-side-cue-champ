import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { AppShell } from "@/components/AppShell";
import { fetchFrames, fetchMatches, fetchPlayers } from "@/lib/db";
import { modeLabel } from "@/lib/game";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Match History — Cue Room Scoreboard" },
      {
        name: "description",
        content: "Chronological log of every snooker frame and race mode game played at the table.",
      },
      { property: "og:title", content: "Match History — Cue Room Scoreboard" },
      { property: "og:description", content: "Every past match with mode, target and final scores." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });
  const { data: frames = [] } = useQuery({ queryKey: ["frames"], queryFn: fetchFrames });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });

  const name = (id: string | null) => players.find((p) => p.id === id)?.name ?? "—";
  const played = matches.filter((m) => m.completed_at);

  return (
    <AppShell title="History" subtitle={`${played.length} matches played`}>
      <div className="space-y-3">
        {played.length === 0 ? (
          <p className="text-sm text-muted-foreground">No finished matches yet.</p>
        ) : null}
        {played.map((m) => {
          const mFrames = frames.filter((f) => f.match_id === m.id);
          const p1Points = mFrames.reduce((s, f) => s + f.player1_score, 0);
          const p2Points = mFrames.reduce((s, f) => s + f.player2_score, 0);
          return (
            <article key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>{modeLabel(m.mode)}</span>
                <span>{format(new Date(m.created_at), "d MMM yyyy · HH:mm")}</span>
              </div>
              <p className="mt-2 text-lg font-semibold">
                {name(m.player1_id)} vs {name(m.player2_id)}
              </p>
              <p className="score-digits mt-1 text-3xl">
                {m.mode === "race" || m.best_of === 1
                  ? `${p1Points} – ${p2Points}`
                  : `${m.player1_frames} – ${m.player2_frames}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Winner: {name(m.winner_id)}
                {m.mode === "race" ? ` · Target ${m.target_score}` : ` · Best of ${m.best_of}`}
                {m.mode === "standard" && m.best_of > 1 ? ` · Points ${p1Points}–${p2Points}` : ""}
              </p>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
