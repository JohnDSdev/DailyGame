# Daily Game

A static archive with one new high-effort browser game and one original article every day.

## Run it anywhere

Download the repository as a ZIP, extract it, and open `index.html` directly in a browser. The site intentionally avoids a build step, backend, package manager, and homepage `fetch()` calls so it can work from `file://` as well as GitHub Pages.

## Structure

```text
DailyGame/
├─ index.html                 # homepage and archive
├─ assets/
│  ├─ site.css                # homepage styling
│  └─ site.js                 # archive rendering
├─ data/
│  └─ days.js                 # ordered metadata for every daily entry
├─ games/
│  └─ YYYY-MM-DD/
│     └─ index.html           # that day's self-contained game
├─ articles/
│  └─ YYYY-MM-DD.html         # that day's article
└─ .github/workflows/
   └─ pages.yml               # GitHub Pages deployment
```

## Daily publishing contract

Every calendar day should add exactly one game and one article.

1. Create `games/YYYY-MM-DD/index.html`.
2. Make the game genuinely substantial and distinct. Rotate genres and mechanics instead of reskinning yesterday's idea. Games may be 2D, 3D, puzzle, arcade, board, strategy, platformer, maze, simulation, experimental, etc.
3. The game must work without a backend and should avoid remote dependencies when practical so the downloaded archive remains playable offline.
4. Support keyboard/mouse and touch when the mechanic reasonably allows it. Include instructions, restart/replay behavior, responsive layout, and polish such as audio-free visual feedback, animation, particles, progression, scoring, levels, procedural generation, or other systems appropriate to the game.
5. Create `articles/YYYY-MM-DD.html` with an original, interesting article on any worthwhile subject. It should be more than filler and should be pleasant to read on desktop and mobile.
6. Add the day's metadata to `data/days.js` with `date`, `title`, `type`, `description`, `symbol`, `gradient`, `game`, `article`, and `articleTitle`.
7. Keep newest entries first in `DAILY_ENTRIES`.
8. Do not change `DAILY_GAME_START`; it is the site's birthday and drives the day counter.
9. Check all relative links from the homepage, game, and article. Everything must continue to work when `index.html` is opened directly from an extracted ZIP.
10. Commit the complete daily entry to `main`. The Pages workflow deploys pushes automatically.

## Site birthday

August 22, 2026.
