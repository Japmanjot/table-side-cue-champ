import { supabase } from "@/integrations/supabase/client";
import type { GameMode } from "./game";

export type Player = { id: string; name: string; archived: boolean; created_at: string };

export type Match = {
  id: string;
  mode: GameMode;
  target_score: number | null;
  best_of: number;
  player1_id: string;
  player2_id: string;
  player1_frames: number;
  player2_frames: number;
  winner_id: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Frame = {
  id: string;
  match_id: string;
  frame_number: number;
  player1_score: number;
  player2_score: number;
  player1_high_break: number;
  player2_high_break: number;
  winner_id: string | null;
  created_at: string;
};

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function addPlayer(name: string) {
  const { error } = await supabase.from("players").insert({ name });
  if (error) throw error;
}

export async function renamePlayer(id: string, name: string) {
  const { error } = await supabase.from("players").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function archivePlayer(id: string) {
  const { error } = await supabase.from("players").update({ archived: true }).eq("id", id);
  if (error) throw error;
}

export async function createMatch(input: {
  mode: GameMode;
  target_score: number | null;
  best_of: number;
  player1_id: string;
  player2_id: string;
}): Promise<Match> {
  const { data, error } = await supabase.from("matches").insert(input).select("*").single();
  if (error) throw error;
  return data as Match;
}

export async function saveFrame(input: {
  match_id: string;
  frame_number: number;
  player1_score: number;
  player2_score: number;
  player1_high_break: number;
  player2_high_break: number;
  winner_id: string | null;
}) {
  const { error } = await supabase.from("frames").insert(input);
  if (error) throw error;
}

export async function updateMatch(
  id: string,
  patch: Partial<Pick<Match, "player1_frames" | "player2_frames" | "winner_id" | "completed_at">>,
) {
  const { error } = await supabase.from("matches").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchMatch(id: string): Promise<Match | null> {
  const { data, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Match) ?? null;
}

export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Match[];
}

export async function fetchFrames(): Promise<Frame[]> {
  const { data, error } = await supabase.from("frames").select("*").limit(2000);
  if (error) throw error;
  return (data ?? []) as Frame[];
}
