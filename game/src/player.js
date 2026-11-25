// Sizzle Rush — the chef: movement, carrying, and click-to-walk.
// The chef moves on the open floor, avoids the stations' counters, and can
// carry one thing at a time: a raw or prepared ingredient, or a whole plate.

import { PLAYER_SPEED, PLAYER_RADIUS, VIEW } from './config.js';
import { stationAt, stationCentre } from './kitchen.js';

export function makePlayer() {
  return {
    x: VIEW.width / 2,
    y: 560,
    vx: 0,
    vy: 0,
    radius: PLAYER_RADIUS,
    // What the chef carries: null, an ingredient key, or { items: [...] }.
    held: null,
    // Click-to-walk target, or null when the player drives with keys.
    target: null,
    // The route to the target: waypoints the chef walks through in order,
    // or null for a straight walk (keyboard driving never sets one).
    path: null,
    facing: 1,
    walkPhase: 0,
    moving: false,
  };
}

function hitsStation(kitchen, x, y, r) {
  for (const s of kitchen.stations) {
    // The serve window is a wall the chef walks in front of, not through.
    const pad = 4;
    if (x + r > s.x + pad && x - r < s.x + s.w - pad && y + r > s.y + pad && y - r < s.y + s.h - pad) {
      return s;
    }
  }
  return null;
}

function tryMove(player, kitchen, nx, ny) {
  const r = player.radius;
  const clampedX = Math.max(r + 8, Math.min(VIEW.width - r - 8, nx));
  const clampedY = Math.max(150 + r, Math.min(VIEW.height - r - 8, ny));
  // Slide along walls: try the full step, then each axis alone.
  if (!hitsStation(kitchen, clampedX, clampedY, r)) {
    player.x = clampedX;
    player.y = clampedY;
    return true;
  }
  if (!hitsStation(kitchen, clampedX, player.y, r)) {
    player.x = clampedX;
    return true;
  }
  if (!hitsStation(kitchen, player.x, clampedY, r)) {
    player.y = clampedY;
    return true;
  }
  return false;
}

// --- Click-to-walk routing -------------------------------------------------
// The counters sit in rows across the floor, so steering straight at a
// station walks the chef into a counter and leaves him stuck there. A click
// therefore plans a route first: A* over a coarse grid (20 px cells) that
// treats every station, padded by the chef's radius, as blocked, then the
// chef walks the waypoints in order. The grid is small (64 x 36), so a
// plain open list with a linear scan is fast enough.

const PATH_CELL = 20;
const PATH_COLS = Math.ceil(VIEW.width / PATH_CELL);
const PATH_ROWS = Math.ceil(VIEW.height / PATH_CELL);

function cellBlocked(kitchen, cx, cy, r) {
  const x = cx * PATH_CELL + PATH_CELL / 2;
  const y = cy * PATH_CELL + PATH_CELL / 2;
  if (y < 150 + r || x < r + 8 || x > VIEW.width - r - 8 || y > VIEW.height - r - 8) return true;
  for (const s of kitchen.stations) {
    const pad = r;
    if (x >= s.x - pad && x <= s.x + s.w + pad && y >= s.y - pad && y <= s.y + s.h + pad) return true;
  }
  return false;
}

// The nearest free cell to (cx, cy), searching outward in rings. Used when
// the start or goal cell is itself blocked (the chef can stand pressed
// against a counter, inside its padded zone).
function nearestFreeCell(kitchen, cx, cy, r) {
  if (!cellBlocked(kitchen, cx, cy, r)) return { cx, cy };
  for (let ring = 1; ring <= 8; ring++) {
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= PATH_COLS || ny >= PATH_ROWS) continue;
        if (!cellBlocked(kitchen, nx, ny, r)) return { cx: nx, cy: ny };
      }
    }
  }
  return { cx, cy };
}

// A route from (sx, sy) to (tx, ty) as waypoints in canvas coordinates, or
// null when no route exists. The last waypoint is the exact destination.
function planPath(kitchen, sx, sy, tx, ty, r) {
  const start = nearestFreeCell(kitchen, Math.floor(sx / PATH_CELL), Math.floor(sy / PATH_CELL), r);
  const goal = nearestFreeCell(kitchen, Math.floor(tx / PATH_CELL), Math.floor(ty / PATH_CELL), r);
  const key = (cx, cy) => cy * PATH_COLS + cx;
  const heur = (cx, cy) => Math.hypot(cx - goal.cx, cy - goal.cy);
  const open = [{ ...start, g: 0, f: heur(start.cx, start.cy), parent: null }];
  const gScore = new Map([[key(start.cx, start.cy), 0]]);
  const closed = new Set();
  while (open.length > 0) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[best].f) best = i;
    const cur = open.splice(best, 1)[0];
    const curKey = key(cur.cx, cur.cy);
    if (closed.has(curKey)) continue;
    closed.add(curKey);
    if (cur.cx === goal.cx && cur.cy === goal.cy) {
      const cells = [];
      let node = cur;
      while (node) { cells.push(node); node = node.parent; }
      cells.reverse();
      // Drop waypoints that lie on a straight, unblocked line from the
      // previous kept one, so the chef cuts corners instead of zig-zagging.
      const waypoints = [];
      for (const c of cells) {
        waypoints.push({ x: c.cx * PATH_CELL + PATH_CELL / 2, y: c.cy * PATH_CELL + PATH_CELL / 2 });
      }
      waypoints.push({ x: tx, y: ty });
      return waypoints;
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cur.cx + dx;
        const ny = cur.cy + dy;
        if (nx < 0 || ny < 0 || nx >= PATH_COLS || ny >= PATH_ROWS) continue;
        const nKey = key(nx, ny);
        if (closed.has(nKey) || cellBlocked(kitchen, nx, ny, r)) continue;
        // No cutting a corner through a blocked diagonal neighbour.
        if (dx !== 0 && dy !== 0
          && (cellBlocked(kitchen, cur.cx + dx, cur.cy, r) || cellBlocked(kitchen, cur.cx, cur.cy + dy, r))) continue;
        const g = cur.g + (dx !== 0 && dy !== 0 ? 1.414 : 1);
        if (g < (gScore.get(nKey) ?? Infinity)) {
          gScore.set(nKey, g);
          open.push({ cx: nx, cy: ny, g, f: g + heur(nx, ny), parent: cur });
        }
      }
    }
  }
  return null;
}

/** Move the chef for one frame. `keys` is a Set of pressed key names. */
export function updatePlayer(player, kitchen, keys, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (dx !== 0 || dy !== 0) {
    // Keyboard driving wins: drop any click route.
    player.target = null;
    player.path = null;
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
  } else if (player.path && player.path.length > 0) {
    // Follow the planned route one waypoint at a time.
    const wp = player.path[0];
    const tx = wp.x - player.x;
    const ty = wp.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 10) {
      player.path.shift();
      if (player.path.length === 0) {
        player.path = null;
        player.target = null;
        if (player.targetStation) {
          player.arrived = player.targetStation;
          player.targetStation = null;
        }
      }
    } else {
      dx = tx / dist;
      dy = ty / dist;
    }
  } else if (player.target) {
    // No route (straight walk): steer directly at the target.
    const tx = player.target.x - player.x;
    const ty = player.target.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 10) {
      player.target = null;
    } else {
      dx = tx / dist;
      dy = ty / dist;
      // Arrived at a station: stop just outside it and interact.
      if (player.target.station) {
        const c = stationCentre(player.target.station);
        const d = Math.hypot(c.x - player.x, c.y - player.y);
        if (d < player.target.station.w / 2 + player.radius + 14) {
          player.target = null;
          player.arrived = player.targetStation;
          player.targetStation = null;
        }
      }
    }
  }
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
    player.walkPhase += dt * 10;
    tryMove(player, kitchen, player.x + dx * PLAYER_SPEED * dt, player.y + dy * PLAYER_SPEED * dt);
  }
}

/** Point the chef at a floor position (mouse click). */
export function walkTo(player, kitchen, x, y) {
  player.target = { x, y, station: null };
  player.targetStation = null;
  player.path = planPath(kitchen, player.x, player.y, x, y, player.radius);
}

/** Point the chef at a station: walk to its front edge, then interact. */
export function walkToStation(player, kitchen, st) {
  const c = stationCentre(st);
  const r = player.radius;
  // Approach from the first side that is actually standable: below first
  // (the open floor side for most stations), then above, left, right. The
  // trash sits at the bottom edge, so below it is off the floor; the bins
  // sit above the board, so below them is the corridor between the rows.
  // A side counts only when the chef's circle fits there and the cell it
  // lands in is free for the route planner.
  const candidates = [
    { x: c.x, y: st.y + st.h + r + 10 },
    { x: c.x, y: st.y - r - 10 },
    { x: st.x - r - 10, y: c.y },
    { x: st.x + st.w + r + 10, y: c.y },
  ];
  let approach = candidates[0];
  for (const cand of candidates) {
    if (cand.x < r + 8 || cand.x > VIEW.width - r - 8 || cand.y < 150 + r || cand.y > VIEW.height - r - 8) continue;
    if (hitsStation(kitchen, cand.x, cand.y, r)) continue;
    if (cellBlocked(kitchen, Math.floor(cand.x / PATH_CELL), Math.floor(cand.y / PATH_CELL), r)) continue;
    approach = cand;
    break;
  }
  player.target = { x: approach.x, y: approach.y, station: st };
  player.targetStation = st;
  player.path = planPath(kitchen, player.x, player.y, approach.x, approach.y, player.radius);
}

/** The station the chef is standing close enough to use, or null. */
export function nearbyStation(player, kitchen) {
  let best = null;
  let bestD = Infinity;
  for (const s of kitchen.stations) {
    const c = stationCentre(s);
    const d = Math.hypot(c.x - player.x, c.y - player.y);
    const reach = s.w / 2 + s.h / 2 + player.radius + 26;
    if (d < reach && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

export function heldLabel(held) {
  if (!held) return null;
  if (typeof held === 'object') return `Plate (${held.items.length})`;
  return held;
}
