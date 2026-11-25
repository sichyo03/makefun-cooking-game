// Sizzle Rush — screenshot scenes behind ?shot=cover|start|rush|serve.
// Each scene sets the real game state (orders, stations, plates, chef, timer)
// to a moment a real shift reaches, then the normal renderer draws it — so
// every screenshot is a genuine render of the game's own code, and the same
// shot always gives the same frame.

import { RECIPES } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function order(id, recipeId, timeLeft, timeMax) {
  const recipe = recipeById(recipeId);
  return { id, recipe, timeLeft, timeMax, served: false, expired: false };
}

function setStation(kitchen, id, patch) {
  const st = kitchen.byId[id];
  Object.assign(st, patch);
  return st;
}

/**
 * Stage the named scene on the live game object and return the screen to draw.
 * The scenes are reachable states: cover is mid-shift with a plate
 * mid-assembly and one ready to serve; rush is the late shift with the timer
 * low; serve is the shift summary after a good run.
 */
export function stageShot(name, game) {
  const { kitchen, orders, player } = game;
  if (name === 'start') {
    game.screen = SCREEN_TITLE;
    game.best = 640;
    return SCREEN_TITLE;
  }
  if (name === 'serve') {
    game.screen = SCREEN_OVER;
    orders.score = 760;
    orders.served = 7;
    orders.bestCombo = 4;
    orders.expiredCount = 1;
    orders.hearts = 2;
    orders.overReason = 'Shift complete! The kitchen closes for the night.';
    orders.list = [];
    orders.timeLeft = 0;
    return SCREEN_OVER;
  }
  if (name === 'rush') {
    game.screen = SCREEN_PLAY;
    orders.score = 540;
    orders.combo = 3;
    orders.bestCombo = 3;
    orders.hearts = 1;
    orders.timeLeft = 24;
    orders.elapsed = 126;
    orders.list = [
      order(11, 'cheese-burger', 9, 55),
      order(12, 'classic-burger', 14, 45),
      order(13, 'garden-salad', 6, 40),
      order(14, 'veggie-stack', 22, 50),
    ];
    // A patty on the grill nearly done, lettuce mid-chop, a plate stacking.
    setStation(kitchen, 'grill', { item: 'patty', work: { kind: 'patty', progress: 3.2, total: 4 }, cookTime: 3.2 });
    setStation(kitchen, 'board', { item: 'lettuce', work: { kind: 'lettuce', progress: 1.1, total: 1.6 } });
    setStation(kitchen, 'plate-a', { plate: ['bun', 'grilled-patty'] });
    setStation(kitchen, 'plate-b', { plate: ['chopped-lettuce', 'chopped-tomato'] });
    player.x = 640;
    player.y = 480;
    player.held = 'cheese';
    player.facing = 1;
    return SCREEN_PLAY;
  }
  // Cover: the most complete view — three orders, a chop and a grill running,
  // a plate mid-assembly, a finished plate carried, timer mid-shift.
  game.screen = SCREEN_PLAY;
  orders.score = 320;
  orders.combo = 2;
  orders.bestCombo = 2;
  orders.hearts = 3;
  orders.timeLeft = 96;
  orders.elapsed = 54;
  orders.list = [
    order(5, 'classic-burger', 31, 45),
    order(6, 'cheese-burger', 18, 55),
    order(7, 'garden-salad', 38, 40),
  ];
  setStation(kitchen, 'board', { item: 'tomato', work: { kind: 'tomato', progress: 0.9, total: 1.6 } });
  setStation(kitchen, 'grill', { item: 'patty', work: { kind: 'patty', progress: 2.4, total: 4 }, cookTime: 2.4 });
  setStation(kitchen, 'plate-a', { plate: ['bun', 'grilled-patty'] });
  setStation(kitchen, 'plate-b', { plate: ['chopped-lettuce'] });
  player.x = 700;
  player.y = 470;
  player.held = { items: ['bun', 'grilled-patty', 'chopped-lettuce'] };
  player.facing = 1;
  return SCREEN_PLAY;
}
