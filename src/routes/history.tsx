import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { deleteMatch, fetchFrames, fetchMatches, fetchPlayers } from "@/lib/db";
import { modeLabel } from "@/lib/game";
import { cn } from "@/lib/utils";


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
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: deleteMatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matches"] }),
        queryClient.invalidateQueries({ queryKey: ["frames"] }),
      ]);
      toast.success("Match deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete match"),
  });

  const confirmDelete = (id: string) => {
    if (window.confirm("Delete this match record?")) remove.mutate(id);
  };


  const name = (id: string | null) => players.find((p) => p.id === id)?.name ?? "—";
  const played = [...matches]
    .filter((m) => m.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.created_at).getTime() -
        new Date(a.completed_at ?? a.created_at).getTime(),
    );

  const groups = new Map<string, typeof played>();
  for (const m of played) {
    const key = format(new Date(m.completed_at ?? m.created_at), "yyyy-MM-dd");
    const list = groups.get(key) ?? [];
    list.push(m);
    groups.set(key, list);
  }

  const heading = (key: string) => {
    const d = new Date(`${key}T00:00:00`);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MM/dd/yyyy");
  };

  return (
    <AppShell title="History" subtitle={`${played.length} matches played`}>
      <div className="space-y-6">
        {played.length === 0 ? (
          <p className="text-sm text-muted-foreground">No finished matches yet.</p>
        ) : null}
        {[...groups.entries()].map(([key, list]) => (
          <section key={key}>
            <div className="sticky top-0 z-10 -mx-1 mb-2 bg-background/90 px-1 py-1 backdrop-blur">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gold">
                {heading(key)}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {list.length} {list.length === 1 ? "match" : "matches"}
              </p>
            </div>
            <div className="space-y-3">
              {list.map((m) => {
                const mFrames = frames.filter((f) => f.match_id === m.id);
                const p1Points = mFrames.reduce((s, f) => s + f.player1_score, 0);
                const p2Points = mFrames.reduce((s, f) => s + f.player2_score, 0);
                return (
                  <article key={m.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                      <span>
                        {modeLabel(m.mode)}
                        {m.mode === "standard" ? ` · ${m.reds_count ?? 15} reds` : ""}
                      </span>
                      <span className="flex items-center gap-3">
                        {format(new Date(m.completed_at ?? m.created_at), "HH:mm")}
                        <button
                          type="button"
                          aria-label="Delete match"
                          onClick={() => confirmDelete(m.id)}
                          disabled={remove.isPending}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground active:scale-95 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
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
                      Frames {m.player1_frames}–{m.player2_frames} · Points {p1Points}–{p2Points}
                    </p>
                    <p className="mt-1 text-xs text-gold">
                      Winner: {name(m.winner_id)}
                      {m.mode === "race" ? ` · Target ${m.target_score}` : ` · Best of ${m.best_of}`}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

