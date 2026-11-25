// Sizzle Rush — orders: the board, the shift clock, scoring and combo.
// Orders arrive, count down, and pay out when a matching plate is served.
// An expired order costs a heart; three lost hearts end the shift early.

import { MAX_ORDERS, MAX_HEARTS, SHIFT_SECONDS, ORDER_FIRST_DELAY } from './config.js';
import { makeOrder, nextOrderGap, plateMatchesOrder, servePoints } from './recipes.js';

export function makeOrders() {
  return {
    list: [],
    nextIn: ORDER_FIRST_DELAY,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    served: 0,
    expiredCount: 0,
    wrongCount: 0,
    over: false,
    overReason: '',
  };
}

export function resetOrders(orders) {
  const fresh = makeOrders();
  Object.assign(orders, fresh);
}

/** Advance the shift: spawn orders, tick their timers, expire the late ones. */
export function updateOrders(orders, dt) {
  if (orders.over) return [];
  const events = [];
  orders.elapsed += dt;
  orders.timeLeft = Math.max(0, SHIFT_SECONDS - orders.elapsed);
  orders.nextIn -= dt;
  if (orders.nextIn <= 0 && orders.list.length < MAX_ORDERS) {
    orders.list.push(makeOrder(orders.elapsed));
    orders.nextIn = nextOrderGap(orders.elapsed);
    events.push('order-new');
  }
  for (const order of orders.list) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0 && !order.expired) {
      order.expired = true;
      orders.expiredCount += 1;
      orders.combo = 0;
      orders.hearts -= 1;
      events.push('order-expired');
      if (orders.hearts <= 0) {
        orders.over = true;
        orders.overReason = 'The dinner rush beat you — too many orders went cold.';
      }
    }
  }
  orders.list = orders.list.filter((o) => !o.expired);
  if (orders.timeLeft <= 0 && !orders.over) {
    orders.over = true;
    orders.overReason = 'Shift complete! The kitchen closes for the night.';
  }
  return events;
}

/**
 * Serve a plate at the pass. Returns { event, points }.
 * A matching plate pays; a plate matching nothing resets the combo.
 */
export function servePlate(orders, plateItems) {
  const match = orders.list.find((o) => plateMatchesOrder(plateItems, o));
  if (!match) {
    orders.combo = 0;
    orders.wrongCount += 1;
    return { event: 'serve-wrong', points: 0 };
  }
  const points = servePoints(match, orders.combo);
  orders.score += points;
  orders.served += 1;
  orders.combo += 1;
  orders.bestCombo = Math.max(orders.bestCombo, orders.combo);
  orders.list = orders.list.filter((o) => o !== match);
  return { event: 'serve-good', points };
}

/** The order the HUD should highlight (the one closest to expiring). */
export function urgentOrder(orders) {
  let urgent = null;
  for (const o of orders.list) {
    if (!urgent || o.timeLeft < urgent.timeLeft) urgent = o;
  }
  return urgent;
}
