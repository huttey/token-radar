# token-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/huttey/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/huttey/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Launch Radar: every pre-token protocol in the sealed DefiLlama snapshot, ranked by what its launch would be worth — and how to farm it.

The board covers all 40 protocols on the snapshot's watchlist plus every other rankable pre-token protocol below the floor (178 rows in all). Implied value is comps-calibrated, not a flat multiple: each protocol's TVL is priced at the median market-cap/TVL of listed protocols in its own category (each ratio capped at 5.0, shrunk toward the market median where a category has few listed names), then adjusted by its 7-day TVL growth, how long it has run with no token, and how many chains it runs on. No protocol name is special-cased. Every row carries a six-step farm plan with concrete costs and times, derived from the protocol's own category, chains, TVL and age. Protocols that already trade are kept apart in their own view, at the market's own values — they are the comparables, never the ranked board.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
```

Node 22.18 or later, standard library only, no install. The run writes `out/board.json` (the ranked board), `out/data.js` (the dashboard's data), `out/dashboard/` (the static page, no network) and `out/dossier.json` (the judge's dossier). Serve `out/` over HTTP and open `dashboard/index.html` to use the radar: sort any column, filter by category, chain or watchlist, search by name, and click any row for its detail view with the value breakdown and farm plan.

## Layout

- `main.ts` — reads the snapshot, scores the board, writes the outputs
- `lib/model.ts` — the comps-calibrated model, farm plans, board checks
- `vendor/makefun-board.ts` — make.fun's dossier library, as shipped in the kit
- `dashboard/` — the static page (index.html, app.css, app.js), no network
- `screenshots/` — the board, a detail view and a filtered view, captured from the page

---

<sub>Entered on [make.fun](https://make.fun/?ref=rsq9xkyh&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
