export type GameMode = "standard" | "race";

export type BallKey = "red" | "yellow" | "green" | "brown" | "blue" | "pink" | "black";

export const BALLS: { key: BallKey; label: string; standard: number; race: number; swatch: string }[] = [
  { key: "red", label: "Red", standard: 1, race: 10, swatch: "var(--ball-red)" },
  { key: "yellow", label: "Yellow", standard: 2, race: 2, swatch: "var(--ball-yellow)" },
  { key: "green", label: "Green", standard: 3, race: 3, swatch: "var(--ball-green)" },
  { key: "brown", label: "Brown", standard: 4, race: 4, swatch: "var(--ball-brown)" },
  { key: "blue", label: "Blue", standard: 5, race: 5, swatch: "var(--ball-blue)" },
  { key: "pink", label: "Pink", standard: 6, race: 6, swatch: "var(--ball-pink)" },
  { key: "black", label: "Black", standard: 7, race: 7, swatch: "var(--ball-black)" },
];

export function ballValue(key: BallKey, mode: GameMode): number {
  const ball = BALLS.find((b) => b.key === key)!;
  return mode === "race" ? ball.race : ball.standard;
}

export const STANDARD_FOULS = [4, 5, 6, 7];
export const RACE_FOUL_RED = 10;
export const RACE_FOUL_OTHER = 4;

/** Supported red-ball variants for standard snooker. */
export const REDS_OPTIONS = [6, 10, 15] as const;
export type RedsCount = (typeof REDS_OPTIONS)[number];

/** Sum of the colours (yellow…black). */
export const COLOURS_POINTS = 27;

/** Max points available on the table at the start of a standard frame. */
export function maxPoints(reds: number): number {
  return reds * 8 + COLOURS_POINTS;
}

export const STANDARD_MAX_POINTS = maxPoints(15);

/**
 * Points still on the table: each remaining red is worth 1 plus a black,
 * plus the colour clearance.
 */
export function pointsRemaining(redsRemaining: number, colourStep = 0): number {
  const colours = [2, 3, 4, 5, 6, 7].slice(colourStep).reduce((a, b) => a + b, 0);
  return redsRemaining * 8 + colours;
}

export function framesToWin(bestOf: number): number {
  return Math.floor(bestOf / 2) + 1;
}

export function modeLabel(mode: GameMode): string {
  return mode === "race" ? "Race Mode" : "Standard Snooker";
}
