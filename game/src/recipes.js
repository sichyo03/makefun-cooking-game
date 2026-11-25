// Sizzle Rush — recipes and order generation.
// An order is a recipe plus a countdown. Orders arrive over the shift, get
// harder (more ingredients, less time) as the shift goes on, and expire.

import { RECIPES, ORDER_MIN_GAP, ORDER_MAX_GAP } from './config.js';

let orderCounter = 0;

/** Pick a recipe, weighted so early orders are simple and later ones mix more. */
export function pickRecipe(elapsedSeconds) {
  const unlocked = RECIPES.filter((r) => {
    if (r.needs.length <= 3) return true;
    return elapsedSeconds > 45;
  });
  const pool = unlocked.length > 0 ? unlocked : RECIPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Build a fresh order for the board. */
export function makeOrder(elapsedSeconds) {
  const recipe = pickRecipe(elapsedSeconds);
  orderCounter += 1;
  // Later in the shift the same dish gets a little less time.
  const pressure = Math.min(0.25, elapsedSeconds / 600);
  const timeLeft = Math.max(25, recipe.time * (1 - pressure));
  return {
    id: orderCounter,
    recipe,
    timeLeft,
    timeMax: timeLeft,
    served: false,
    expired: false,
  };
}

/** Seconds until the next order should appear, shrinking as the shift heats up. */
export function nextOrderGap(elapsedSeconds) {
  const span = ORDER_MAX_GAP - ORDER_MIN_GAP;
  const heat = Math.min(1, elapsedSeconds / SHIFT_PRESSURE_SECONDS);
  return ORDER_MAX_GAP - span * heat + Math.random() * 2;
}

export const SHIFT_PRESSURE_SECONDS = 120;

/** Does a plate's contents match this order exactly (same items, any order)? */
export function plateMatchesOrder(plateItems, order) {
  const want = [...order.recipe.needs].sort();
  const have = [...plateItems].sort();
  if (want.length !== have.length) return false;
  for (let i = 0; i < want.length; i += 1) {
    if (want[i] !== have[i]) return false;
  }
  return true;
}

/** Points for serving an order: recipe points + combo bonus + rush bonus. */
export function servePoints(order, combo) {
  let points = order.recipe.points + combo * 15;
  if (order.timeLeft > order.timeMax / 2) points += 25;
  return points;
}
