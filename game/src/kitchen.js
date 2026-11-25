// Sizzle Rush — the kitchen: stations, what sits on them, and the work that
// turns a raw ingredient into a prepared one (chop, grill, assemble, serve).
// The kitchen owns the floor plan and every interaction the chef can do.

import {
  INGREDIENTS, CHOP_SECONDS, GRILL_SECONDS, BURN_SECONDS, preparedKey,
} from './config.js';

// Station kinds. Bins hand out raw ingredients; the board chops; the grill
// cooks; plates assemble; the pass serves; the bin trashes.
export const STATION_KIND = {
  BIN: 'bin', BOARD: 'board', GRILL: 'grill', PLATE: 'plate', SERVE: 'serve', TRASH: 'trash',
};

function station(id, kind, x, y, w, h, label, item) {
  return {
    id, kind, x, y, w, h, label, item: item || null,
    // Work in progress on this station: { kind, progress, done } or null.
    work: null,
    // For plates: the prepared ingredients already stacked on the plate.
    plate: kind === STATION_KIND.PLATE ? [] : null,
    // For the grill: seconds the patty has been cooking (for burning).
    cookTime: 0,
    flash: 0,
  };
}

/** The floor plan: bins along the top, board and grill in the middle, plates and pass on the right. */
export function buildKitchen() {
  const stations = [
    station('bin-bun', STATION_KIND.BIN, 60, 170, 86, 76, 'Buns', 'bun'),
    station('bin-patty', STATION_KIND.BIN, 158, 170, 86, 76, 'Patties', 'patty'),
    station('bin-lettuce', STATION_KIND.BIN, 256, 170, 86, 76, 'Lettuce', 'lettuce'),
    station('bin-tomato', STATION_KIND.BIN, 354, 170, 86, 76, 'Tomatoes', 'tomato'),
    station('bin-cheese', STATION_KIND.BIN, 452, 170, 86, 76, 'Cheese', 'cheese'),
    station('board', STATION_KIND.BOARD, 60, 320, 170, 110, 'Chopping Board', null),
    station('grill', STATION_KIND.GRILL, 270, 320, 200, 110, 'Grill', null),
    station('plate-a', STATION_KIND.PLATE, 560, 320, 150, 110, 'Plate A', null),
    station('plate-b', STATION_KIND.PLATE, 730, 320, 150, 110, 'Plate B', null),
    station('serve', STATION_KIND.SERVE, 950, 170, 270, 230, 'Serve Window', null),
    station('trash', STATION_KIND.TRASH, 60, 640, 110, 56, 'Trash', null),
  ];
  return { stations, byId: Object.fromEntries(stations.map((s) => [s.id, s])) };
}

export function stationAt(kitchen, x, y) {
  for (const s of kitchen.stations) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
  }
  return null;
}

export function stationCentre(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

/** Advance chop/grill work. Returns event strings for sound + feedback. */
export function updateKitchen(kitchen, dt) {
  const events = [];
  for (const s of kitchen.stations) {
    if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
    if (!s.work) continue;
    s.work.progress += dt;
    if (s.kind === STATION_KIND.GRILL) s.cookTime += dt;
    const total = s.work.total;
    if (s.work.progress >= total) {
      if (s.kind === STATION_KIND.BOARD) {
        // Chopping finishes: the raw vegetable becomes a prepared one.
        s.item = preparedKey(s.work.kind);
        s.work = null;
        events.push('chop-done');
      } else if (s.kind === STATION_KIND.GRILL) {
        // Grilling finishes: the patty is cooked; leave it and it burns.
        s.item = preparedKey(s.work.kind);
        s.work = null;
        events.push('grill-done');
      }
    }
    // A cooked patty left on the grill too long burns and must be trashed.
    if (s.kind === STATION_KIND.GRILL && s.item === 'grilled-patty' && s.cookTime >= BURN_SECONDS) {
      s.item = 'burnt-patty';
      events.push('burnt');
    }
  }
  return events;
}

/**
 * What happens when the chef interacts with a station while carrying `held`
 * (an ingredient key, a plate object, or null). Returns { held, event }.
 */
export function interact(kitchen, st, held) {
  if (!st) return { held, event: null };
  st.flash = 0.25;
  if (st.kind === STATION_KIND.BIN) {
    if (held) return { held, event: 'hands-full' };
    return { held: st.item, event: 'pickup' };
  }
  if (st.kind === STATION_KIND.BOARD) {
    if (st.work) return { held, event: null };
    if (st.item) {
      if (held) return { held, event: 'hands-full' };
      const taken = st.item;
      st.item = null;
      return { held: taken, event: 'pickup' };
    }
    if (!held) return { held, event: null };
    const need = INGREDIENTS[held];
    if (!need || need.needs !== 'chop') return { held, event: 'no-chop' };
    st.item = held;
    st.work = { kind: held, progress: 0, total: CHOP_SECONDS };
    return { held: null, event: 'chop-start' };
  }
  if (st.kind === STATION_KIND.GRILL) {
    if (st.work) return { held, event: null };
    if (st.item) {
      if (held) return { held, event: 'hands-full' };
      const taken = st.item;
      st.item = null;
      st.cookTime = 0;
      return { held: taken, event: 'pickup' };
    }
    if (!held) return { held, event: null };
    const need = INGREDIENTS[held];
    if (!need || need.needs !== 'grill') return { held, event: 'no-grill' };
    st.item = held;
    st.work = { kind: held, progress: 0, total: GRILL_SECONDS };
    st.cookTime = 0;
    return { held: null, event: 'grill-start' };
  }
  if (st.kind === STATION_KIND.PLATE) {
    if (!held) {
      // Empty hands + a stacked plate: pick the plate up to carry it.
      if (st.plate.length === 0) return { held, event: null };
      const plate = { items: st.plate };
      st.plate = [];
      return { held: plate, event: 'pickup-plate' };
    }
    if (typeof held === 'object') return { held, event: 'hands-full' };
    // Add a prepared ingredient to the plate. Raw ones cannot be plated.
    if (!held.startsWith('chopped-') && held !== 'grilled-patty' && held !== 'bun' && held !== 'cheese') {
      return { held, event: 'not-ready' };
    }
    if (st.plate.includes(held)) return { held, event: 'already-on' };
    st.plate.push(held);
    return { held: null, event: 'plate-add' };
  }
  if (st.kind === STATION_KIND.SERVE) {
    // Serving is resolved by orders.js; the kitchen just hands the plate over.
    if (held && typeof held === 'object') {
      return { held: null, event: 'serve', plate: held };
    }
    return { held, event: held ? 'not-a-plate' : null };
  }
  if (st.kind === STATION_KIND.TRASH) {
    if (!held) return { held, event: null };
    return { held: null, event: 'trash' };
  }
  return { held, event: null };
}

/** Clear every station (new shift). */
export function resetKitchen(kitchen) {
  for (const s of kitchen.stations) {
    s.work = null;
    s.cookTime = 0;
    s.flash = 0;
    if (s.kind === STATION_KIND.PLATE) s.plate = [];
    else if (s.kind !== STATION_KIND.BIN) s.item = null;
  }
}
