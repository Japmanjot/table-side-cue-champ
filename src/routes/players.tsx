import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPlayer, archivePlayer, fetchPlayers, renamePlayer } from "@/lib/db";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players — Cue Room Scoreboard" },
      {
        name: "description",
        content: "Manage the local player profiles used for snooker and race mode matches.",
      },
      { property: "og:title", content: "Players — Cue Room Scoreboard" },
      { property: "og:description", content: "Add, rename or retire player profiles." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const qc = useQueryClient();
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["players"] });

  const create = useMutation({
    mutationFn: () => addPlayer(newName.trim()),
    onSuccess: () => {
      setNewName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: () => renamePlayer(editingId!, editName.trim()),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => archivePlayer(id),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Players" subtitle="Local profiles for this table">
      <div className="space-y-3">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3"
          >
            {editingId === p.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  disabled={!editName.trim()}
                  onClick={() => rename.mutate()}
                  aria-label="Save name"
                >
                  <Check className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-lg font-semibold">{p.name}</span>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => {
                    setEditingId(p.id);
                    setEditName(p.name);
                  }}
                  aria-label={`Rename ${p.name}`}
                >
                  <Pencil className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 text-destructive"
                  onClick={() => remove.mutate(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add player"
            className="h-12"
          />
          <Button
            size="icon"
            className="h-12 w-12 shrink-0"
            disabled={!newName.trim() || create.isPending}
            onClick={() => create.mutate()}
            aria-label="Add player"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
