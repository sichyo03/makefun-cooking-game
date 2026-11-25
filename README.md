# Sizzle Rush — Best Cooking Game

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sichyo03/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sichyo03/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A fast, frantic little order-cooking game. The shift lasts 150 seconds: tickets
keep arriving on the order board, and you are the only chef in the kitchen.

## How to play

Open `game/index.html` in a desktop browser — no server, no network, no build
step. Everything is drawn on canvas with original flat art, and all sound is
synthesised with WebAudio (no audio files).

- **Move:** WASD or arrow keys, or click anywhere to walk there.
- **Interact:** E or Space (or click a station while standing next to it).
- **Trash what you are holding:** Q. **Pause:** P. **Restart:** R.
- **Mute:** M. **Start / serve:** Enter.

Grab ingredients from the bins (bun, patty, lettuce, tomato, cheese), chop
lettuce and tomato on the chopping board (1.6 s), grill patties on the grill
(4 s — a patty left for 9 s burns), stack dishes on the two assembly plates,
and carry a finished plate to the Serve Window before the ticket's timer runs
out. Serve the right dish for a score bonus, chain serves into a combo, and
keep the rush alive: every expired ticket costs one of your three hearts.

Five recipes combine the same ingredients in different ways, so the route you
walk changes with every ticket: Classic Burger, Cheese Burger, Garden Salad,
Patty Melt, and Veggie Stack. Orders arrive faster as the shift goes on, and
the last 30 seconds are a full rush.

## Files

- `game/index.html` — the page shell (canvas + status line).
- `game/src/config.js` — view size, shift length, ingredients, recipes, timings.
- `game/src/recipes.js` — picking orders, matching a plate to a ticket, scoring.
- `game/src/kitchen.js` — the floor plan: bins, board, grill, plates, serve, trash.
- `game/src/player.js` — the chef: walking, click-to-walk, carrying.
- `game/src/orders.js` — the order board: spawning, countdowns, hearts, combo.
- `game/src/audio.js` — WebAudio beeps (pickup, chop, grill, serve, alarms).
- `game/src/input.js` — keyboard + pointer input.
- `game/src/render.js` — all canvas drawing: kitchen, HUD, tickets, chef, screens.
- `game/src/shots.js` — the staged scenes used for the screenshots.
- `game/src/main.js` — boot, game loop, screens, and interactions.
- `main.ts` — copies `game/` and `screenshots/` to the output and writes
  `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.
- `vendor/makefun-game.ts` — the kit's dossier builder, unchanged.
- `screenshots/` — four real renders of the game (cover, title, rush, shift over).

## Screenshots

1. `1-cover.png` — mid-shift: three tickets, a tomato chopping, a patty
   sizzling, Plate A mid-assembly, and the chef carrying a finished burger.
2. `2-start.png` — the title screen over the kitchen.
3. `3-rush.png` — the final 30 seconds: four tickets, one heart, combo x3.
4. `4-serve.png` — the shift summary after serving 7 dishes.

---

Built for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). If you build something here too, my referral code is `p3gwn12d`.
