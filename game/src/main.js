// Sizzle Rush — entry point: boot, the game loop, screens and interactions.
// The game has three screens (title, play, over) and one loop. The loop reads
// input, moves the chef, works the stations, ticks the orders, and draws.

import { VIEW } from './config.js';
import { buildKitchen, updateKitchen, interact, resetKitchen, stationAt, stationCentre } from './kitchen.js';
import { makePlayer, updatePlayer, walkTo, walkToStation, nearbyStation } from './player.js';
import { makeOrders, resetOrders, updateOrders, servePlate } from './orders.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { makeInput, endFrame } from './input.js';
import { playSound, unlockAudio, toggleMute, isMuted } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const game = {
  kitchen: buildKitchen(),
  player: makePlayer(),
  orders: makeOrders(),
  screen: SCREEN_TITLE,
  paused: false,
  best: 0,
  toasts: [],
  nearby: null,
  shot: null,
};

const input = makeInput(canvas);
fitCanvas();
window.addEventListener('resize', fitCanvas);

function toast(text, good, x, y) {
  game.toasts.push({ text, good: good !== false, x: x ?? VIEW.width / 2, y: y ?? 300, life: 1.4 });
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function startShift() {
  resetKitchen(game.kitchen);
  game.player = makePlayer();
  resetOrders(game.orders);
  game.toasts = [];
  game.screen = SCREEN_PLAY;
  game.paused = false;
  announce('Shift started. Serve the orders before their timers run out.');
  playSound('order-new');
}

function endShift() {
  game.screen = SCREEN_OVER;
  game.best = Math.max(game.best, game.orders.score);
  announce(`Shift over. Score ${game.orders.score}. Dishes served ${game.orders.served}.`);
  playSound('game-over');
}

function doInteract() {
  const st = nearbyStation(game.player, game.kitchen);
  if (!st) return;
  const heldBefore = game.player.held;
  const result = interact(game.kitchen, st, heldBefore);
  game.player.held = result.held;
  if (result.event === 'serve' && result.plate) {
    const served = servePlate(game.orders, result.plate.items);
    if (served.event === 'serve-good') {
      toast(`+${served.points}  ${'★'.repeat(1)}`, true, st.x + st.w / 2, st.y - 16);
      announce(`Served! Plus ${served.points} points.`);
      playSound('serve-good');
    } else {
      toast('No order wants that plate…', false, st.x + st.w / 2, st.y - 16);
      announce('That plate matches no open order. Combo lost.');
      playSound('serve-wrong');
    }
    return;
  }
  if (result.event) playSound(result.event);
  if (result.event === 'hands-full') toast('Hands full!', false, game.player.x, game.player.y - 50);
  if (result.event === 'not-ready') toast('That needs chopping or grilling first!', false, game.player.x, game.player.y - 50);
  if (result.event === 'no-chop') toast('Only lettuce and tomato go on the board.', false, game.player.x, game.player.y - 50);
  if (result.event === 'no-grill') toast('Only patties go on the grill.', false, game.player.x, game.player.y - 50);
}

function doTrash() {
  if (!game.player.held) return;
  game.player.held = null;
  playSound('trash');
  toast('Trashed.', true, game.player.x, game.player.y - 50);
}

function handleClick(click) {
  if (game.screen !== SCREEN_PLAY || game.paused) return;
  const st = stationAt(game.kitchen, click.x, click.y);
  if (st) {
    walkToStation(game.player, game.kitchen, st);
    game.player.targetStation = st;
    return;
  }
  walkTo(game.player, game.kitchen, click.x, click.y);
}

function playEvents(events) {
  for (const e of events) {
    if (e === 'order-expired') {
      toast('An order went cold! ♥ lost', false);
      announce('An order expired. You lost a heart.');
    }
    playSound(e);
  }
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (input.mutePressed) {
    const muted = toggleMute();
    toast(muted ? 'Sound off' : 'Sound on', true);
  }

  if (game.screen === SCREEN_TITLE) {
    if (input.startPressed || input.click) {
      unlockAudio();
      playSound('click');
      startShift();
    }
  } else if (game.screen === SCREEN_PLAY) {
    if (input.pausePressed) {
      game.paused = !game.paused;
      playSound('click');
    }
    if (!game.paused) {
      updatePlayer(game.player, game.kitchen, input.keys, dt);
      // Arrived at a station by click: interact automatically.
      if (game.player.arrived) {
        const st = game.player.arrived;
        game.player.arrived = null;
        const heldBefore = game.player.held;
        const result = interact(game.kitchen, st, heldBefore);
        game.player.held = result.held;
        if (result.event === 'serve' && result.plate) {
          const served = servePlate(game.orders, result.plate.items);
          if (served.event === 'serve-good') {
            toast(`+${served.points}`, true, st.x + st.w / 2, st.y - 16);
            playSound('serve-good');
          } else {
            toast('No order wants that plate…', false, st.x + st.w / 2, st.y - 16);
            playSound('serve-wrong');
          }
        } else if (result.event) {
          playSound(result.event);
        }
      }
      if (input.click) handleClick(input.click);
      if (input.interactPressed) doInteract();
      if (input.trashPressed) doTrash();
      playEvents(updateKitchen(game.kitchen, dt));
      playEvents(updateOrders(game.orders, dt));
      game.nearby = nearbyStation(game.player, game.kitchen);
      if (game.orders.over) endShift();
    }
  } else if (game.screen === SCREEN_OVER) {
    if (input.restartPressed || input.startPressed) {
      unlockAudio();
      playSound('click');
      startShift();
    }
  }

  for (const t of game.toasts) {
    t.life -= dt;
    t.y -= dt * 24;
  }
  game.toasts = game.toasts.filter((t) => t.life > 0);

  render(ctx, game);
  endFrame(input);
  requestAnimationFrame(frame);
}

// Screenshot mode: ?shot=cover|start|rush|serve stages a fixed scene and
// freezes it (no loop updates), so the frame is exactly what a real shift
// reaches and the same shot always renders the same image.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  game.shot = shot;
  const screen = stageShot(shot, game);
  game.screen = screen;
  render(ctx, game);
  document.title = `Sizzle Rush — shot ${shot}`;
} else {
  requestAnimationFrame(frame);
}
