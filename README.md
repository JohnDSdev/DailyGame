# Daily Game

One new browser game and one researched article every day. The whole archive is static: download the repository, unzip it, open `index.html`, and it should still work.

## Run it anywhere

There is no build step, package manager, backend, or homepage `fetch()` call. Relative paths are intentional so the same files work from `file://` and from GitHub Pages.

## Structure

```text
DailyGame/
├─ index.html
├─ assets/
│  ├─ site.css
│  ├─ site.js
│  └─ favicon.svg
├─ data/
│  └─ days.js
├─ games/
│  └─ YYYY-MM-DD/
│     ├─ index.html
│     └─ preview.svg
├─ articles/
│  └─ YYYY-MM-DD.html
├─ guides/
│  └─ QUALITY.md
└─ .github/workflows/
   └─ pages.yml
```

## Before making a daily entry

Read `guides/QUALITY.md`. It defines the game, writing, mobile, and visual quality bar. In particular, the article workflow requires reading the linked Unslop skill, blacklist, and prose benchmarks before drafting.

## Daily publishing contract

1. Create `games/YYYY-MM-DD/index.html` and `games/YYYY-MM-DD/preview.svg`.
2. The game must be meaningfully different from recent entries. Rotate genres, interaction models, art direction, and pacing rather than reskinning yesterday's code.
3. Treat mobile as a primary platform. Use touch controls that fit the mechanic instead of miniature desktop controls. Also support keyboard/mouse when useful.
4. Keep the game self-contained and offline-friendly. Remote dependencies should be exceptional because an extracted ZIP must remain playable.
5. Add enough craft to justify the daily slot: level design or procedural depth, feedback, saved state, replayability, animation/audio where appropriate, good instructions, and clean restart/win/loss behavior.
6. Research and write `articles/YYYY-MM-DD.html`. Read the Unslop material linked in `guides/QUALITY.md` first. Use real sources, link them, and keep unsupported specifics out.
7. Add the entry to `data/days.js` with `date`, `title`, `type`, `description`, `accent`, `preview`, `game`, `article`, `articleTitle`, and `articleDescription`.
8. Keep `DAILY_ENTRIES` newest-first. Never change `DAILY_GAME_START`.
9. Check all relative links and avoid APIs that fail solely because the site was opened with `file://`.
10. Commit the complete entry to `main`; the Pages workflow deploys it.

## Site birthday

August 22, 2026.
