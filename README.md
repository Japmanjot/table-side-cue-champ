# Snooker Cue Clock

Build a single-device, mobile-first Snooker & Race Mode Scoreboard PWA designed to sit table-side on an iPhone, backed by Supabase for data persistence.



1. Player Setup & Match Launcher:

- Pre-configured local player profiles for 3 players: [Your Name], [Dad's Name], [Brother's Name] (allow adding/editing profiles).

- Match Setup Screen:

  * Select Striker 1 and Striker 2.

  * Select Game Mode: "Standard Snooker" vs. "Race Mode".

  * Match Length for Standard Snooker: Single Frame, Best of 3, Best of 5, Best of 7.

  * Target Score Selector for Race Mode:

    - Default starting value: 50 points.

    - Quick increment/decrement controls (+10 / -10, or custom number input) to adjust target score (e.g., 50, 75, 100, 150) before launching the match.



2. Game Modes & Scoring Logic:

- Standard Snooker Mode:

  * 15 Reds (1 pt each) + 6 Colours: Yellow (2), Green (3), Brown (4), Blue (5), Pink (6), Black (7).

  * Standard Fouls: +4, +5, +6, +7 awarded to the opponent.

  * Max initial table points = 147.

- Race Mode (Custom 1-Red Target Score Variant):

  * Balls on table: Exactly 1 Red + 6 standard Colours.

  * Red value: 10 points. Whenever potted, the Red ball re-spots back on the table.

  * Colours: Standard values (Yellow 2, Green 3, Brown 4, Blue 5, Pink 6, Black 7) which also re-spot after potting.

  * Auto-Finish Condition: The frame automatically finishes when a player reaches or exceeds the configured Target Score (default 50), triggering a victory celebration screen.

  * Foul System for Race Mode:

    - "Red Miss / Foul on Red": Awards exactly +10 penalty points to the opponent.

    - "All Other Fouls" (in-off, wrong colour, table foul): Award exactly +4 penalty points to the opponent.



3. Live Scoreboard UI (Optimized for Table-Side Tapping):

- Dark slate and snooker felt green theme with high-contrast, large touch targets.

- Race Mode HUD: Prominently displays the configured target score and a visual progress bar toward the target (e.g., "Target: 50 | Player 1: 34/50").

- Turn controls: Highlighting the active striker with a one-tap "Switch Turn" button.

- Ball tap bar: Red (+10 in Race, +1 in Standard), Yellow (+2), Green (+3), Brown (+4), Blue (+5), Pink (+6), Black (+7).

- Race Mode Foul Bar: Large "+10 Red Foul" button and a "+4 Other Foul" button.

- Live break counter, "Undo Last Action" button, and "End Frame / Concede" button.



4. Stats, Head-to-Head & History:

- Strict separation of statistics between "Standard Snooker" and "Race Mode".

- Head-to-Head screen: Compare any 2 players (Win/Loss record, frames won, average score).

- Records Dashboard: Highest single breaks per mode and total matches won.

- Match History feed: Chronological logs showing date, game mode, target score (for Race Mode), and final scores.



5. Technical & iOS Configuration:

- Full PWA configuration (manifest.json, apple-touch-icon, apple-mobile-web-app-capable) to display full-screen without Safari URL bars when added to the iOS Home Screen.

- Persist all player profiles, matches, and high breaks in Supabase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://table-side-cue-champ.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5f3c8dd7-497c-4681-94ff-48a064302083).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
