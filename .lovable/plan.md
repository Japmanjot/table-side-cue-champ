# Export current data as CSV files

Generate downloadable CSV exports of the three backend tables so you can open or re-import them elsewhere.

## What you get

- `players.csv` — 3 rows
- `matches.csv` — 27 rows
- `frames.csv` — 21 rows

Each file uses the exact column headers from the backend schema, ordered by `created_at`.

## Technical notes

- Read-only export from the database to `/mnt/documents/` as `text/csv`.
- No project source files are changed; no schema or data changes.
- Import order for restoring: players, then matches, then frames (foreign keys).
