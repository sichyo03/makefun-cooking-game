// Sizzle Rush — rendering: every pixel of the kitchen, drawn on one canvas.
// Flat, warm, readable art: tiled floor, wooden counters, chunky ingredient
// icons with labels, an order board you can read at a glance, and a timer
// that turns red when the shift is nearly done.

import { VIEW, INGREDIENTS, displayName, baseColor, SHIFT_SECONDS } from './config.js';
import { STATION_KIND } from './kitchen.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const FLOOR_A = '#c98f5f';
const FLOOR_B = '#bd8252';
const WALL = '#f3e2c7';
const WALL_TILE = '#e8d3ac';
const COUNTER = '#8a5a33';
const COUNTER_TOP = '#a9743f';
const STEEL = '#9aa5ad';
const INK = '#2b2118';
const CREAM = '#fff6e3';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

/** Draw one ingredient icon at (cx, cy) with radius r. */
export function drawIngredientIcon(ctx, key, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  if (key === 'bun') {
    ctx.fillStyle = '#e8b06a';
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d89a4e';
    ctx.fillRect(-r, 0, r * 2, r * 0.45);
    ctx.fillStyle = '#fff3d6';
    circle(ctx, -r * 0.4, -r * 0.45, r * 0.12);
    ctx.fill();
    circle(ctx, r * 0.35, -r * 0.55, r * 0.12);
    ctx.fill();
    circle(ctx, 0, -r * 0.2, r * 0.12);
    ctx.fill();
  } else if (key === 'patty' || key === 'grilled-patty' || key === 'burnt-patty') {
    ctx.fillStyle = key === 'burnt-patty' ? '#241d1a' : key === 'grilled-patty' ? '#7a3f2c' : '#a85f4b';
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5);
    ctx.fill();
    if (key === 'grilled-patty') {
      ctx.strokeStyle = '#5d2c1e';
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.6 + i * r * 0.2, -r * 0.5);
        ctx.lineTo(-r * 0.6 + i * r * 0.2, r * 0.5);
        ctx.stroke();
      }
    }
  } else if (key === 'lettuce' || key === 'chopped-lettuce') {
    ctx.fillStyle = key === 'chopped-lettuce' ? '#8fd694' : '#5da85f';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f8f4f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(0, -r * 0.5, r * 0.7, 0);
    ctx.stroke();
    if (key === 'chopped-lettuce') {
      ctx.strokeStyle = '#2f7a3e';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, r * 0.3);
      ctx.lineTo(r * 0.4, r * 0.3);
      ctx.stroke();
    }
  } else if (key === 'tomato' || key === 'chopped-tomato') {
    ctx.fillStyle = '#e2574c';
    circle(ctx, 0, r * 0.1, r * 0.85);
    ctx.fill();
    ctx.fillStyle = '#4d8a3f';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(-r * 0.35, -r * 0.95);
    ctx.lineTo(0, -r * 0.75);
    ctx.lineTo(r * 0.35, -r * 0.95);
    ctx.closePath();
    ctx.fill();
    if (key === 'chopped-tomato') {
      ctx.strokeStyle = '#ffb3a7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.5, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
  } else if (key === 'cheese') {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a520';
    circle(ctx, -r * 0.25, r * 0.15, r * 0.14);
    ctx.fill();
    circle(ctx, r * 0.3, r * 0.3, r * 0.11);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 0, VIEW.width, 150);
  ctx.fillStyle = WALL_TILE;
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.fillRect(x, 128, 60, 22);
  }
  ctx.fillStyle = '#d9c39a';
  ctx.fillRect(0, 148, VIEW.width, 4);
  for (let y = 152; y < VIEW.height; y += 64) {
    for (let x = ((y / 64) % 2 === 0 ? 0 : -32); x < VIEW.width; x += 64) {
      ctx.fillStyle = (x / 64 + y / 64) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, 62, 62);
    }
  }
}

function drawHud(ctx, orders, screen) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, VIEW.width, 56);
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍳 SIZZLE RUSH', 16, 30);
  // Shift timer: big, centre, turns red under 30 seconds.
  const t = Math.max(0, Math.ceil(orders.timeLeft));
  const mm = Math.floor(t / 60);
  const ss = String(t % 60).padStart(2, '0');
  const low = t <= 30 && screen === SCREEN_PLAY;
  ctx.fillStyle = low ? '#ff6b5e' : CREAM;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`⏱ ${mm}:${ss}`, VIEW.width / 2, 30);
  if (low) {
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('RUSH!', VIEW.width / 2 + 78, 30);
  }
  // Score, combo and hearts on the right.
  ctx.textAlign = 'right';
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`★ ${orders.score}`, VIEW.width - 170, 30);
  ctx.fillStyle = orders.combo >= 2 ? '#ffb347' : '#c9b8a3';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(orders.combo >= 2 ? `🔥 x${orders.combo}` : '—', VIEW.width - 90, 30);
  ctx.textAlign = 'left';
  let hx = VIEW.width - 62;
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < orders.hearts ? '#ff5e7a' : '#5a4636';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('♥', hx, 30);
    hx += 22;
  }
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const urgent = order.timeLeft <= 12;
  ctx.fillStyle = urgent ? '#ffe3de' : CREAM;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#e2574c' : '#d9c39a';
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`#${order.id} ${order.recipe.name}`, x + 10, y + 21);
  // Ingredient dots, in the order the recipe lists them.
  let ix = x + 12;
  for (const need of order.recipe.needs) {
    drawIngredientIcon(ctx, need, ix + 11, y + 44, 10);
    ix += 26;
  }
  ctx.fillStyle = '#7a6a55';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`${order.recipe.points} pts`, x + 10, y + h - 8);
  // Countdown bar.
  const frac = Math.max(0, order.timeLeft / order.timeMax);
  ctx.fillStyle = '#e5d6bd';
  rr(ctx, x + 10, y + h - 26, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#5da85f' : frac > 0.25 ? '#f5a742' : '#e2574c';
  rr(ctx, x + 10, y + h - 26, Math.max(8, (w - 20) * frac), 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? '#e2574c' : '#7a6a55';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 21);
  ctx.textAlign = 'left';
}

function drawOrderBoard(ctx, orders) {
  ctx.fillStyle = '#3a2c1e';
  rr(ctx, 16, 64, VIEW.width - 32, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ORDER BOARD', 30, 80);
  ctx.fillStyle = '#c9b8a3';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Serve the plate that matches a ticket before its timer runs out.', 140, 80);
  if (orders.list.length === 0) {
    ctx.fillStyle = '#c9b8a3';
    ctx.font = 'italic 16px system-ui, sans-serif';
    ctx.fillText('No orders yet — the first ticket is coming…', 30, 128);
    return;
  }
  let x = 30;
  for (const order of orders.list) {
    drawOrderTicket(ctx, order, x, 88, 250, 60);
    x += 262;
  }
}

function drawStationBase(ctx, st) {
  const flash = st.flash > 0;
  ctx.fillStyle = flash ? '#ffe9a8' : COUNTER_TOP;
  rr(ctx, st.x, st.y, st.w, st.h, 10);
  ctx.fill();
  ctx.fillStyle = COUNTER;
  rr(ctx, st.x, st.y + st.h - 14, st.w, 14, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  rr(ctx, st.x, st.y, st.w, st.h, 10);
  ctx.stroke();
  ctx.fillStyle = '#fff6e3';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(st.label.toUpperCase(), st.x + st.w / 2, st.y + st.h - 20);
}

function drawProgressRing(ctx, cx, cy, r, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  circle(ctx, cx, cy, r + 4);
  ctx.fill();
  ctx.strokeStyle = '#e5d6bd';
  ctx.lineWidth = 5;
  circle(ctx, cx, cy, r);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.stroke();
}

function drawStations(ctx, kitchen) {
  for (const st of kitchen.stations) {
    if (st.kind === STATION_KIND.SERVE) {
      // The pass: a bright serving window with a bell.
      ctx.fillStyle = '#2f6f4f';
      rr(ctx, st.x, st.y, st.w, st.h, 12);
      ctx.fill();
      ctx.fillStyle = '#d8f3d8';
      rr(ctx, st.x + 12, st.y + 12, st.w - 24, 110, 8);
      ctx.fill();
      ctx.fillStyle = '#2f6f4f';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔔  SERVE', st.x + st.w / 2, st.y + 58);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText('Bring a finished plate here', st.x + st.w / 2, st.y + 84);
      ctx.fillStyle = '#f5c542';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('E  to serve', st.x + st.w / 2, st.y + 150);
      ctx.fillStyle = '#fff6e3';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Match a ticket to score!', st.x + st.w / 2, st.y + 200);
      continue;
    }
    if (st.kind === STATION_KIND.TRASH) {
      ctx.fillStyle = '#5a4636';
      rr(ctx, st.x, st.y, st.w, st.h, 8);
      ctx.fill();
      ctx.fillStyle = '#fff6e3';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🗑 TRASH', st.x + st.w / 2, st.y + 24);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText('Q to drop', st.x + st.w / 2, st.y + 42);
      continue;
    }
    drawStationBase(ctx, st);
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2 - 8;
    if (st.kind === STATION_KIND.BIN) {
      drawIngredientIcon(ctx, st.item, cx, cy - 4, 22);
      ctx.fillStyle = '#fff6e3';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(INGREDIENTS[st.item].name, cx, st.y + st.h - 34);
    } else if (st.kind === STATION_KIND.BOARD) {
      // Chopping board: a wooden board; a vegetable on it with a progress ring.
      ctx.fillStyle = '#d9b380';
      rr(ctx, st.x + 18, st.y + 14, st.w - 36, 56, 8);
      ctx.fill();
      if (st.work) {
        drawIngredientIcon(ctx, st.work.kind, cx, cy - 6, 18);
        drawProgressRing(ctx, cx + 44, cy - 6, 16, st.work.progress / st.work.total, '#f5a742');
        ctx.fillStyle = '#fff6e3';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText('CHOPPING…', cx, st.y + st.h - 34);
      } else if (st.item) {
        drawIngredientIcon(ctx, st.item, cx, cy - 6, 18);
        ctx.fillStyle = '#fff6e3';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(displayName(st.item), cx, st.y + st.h - 34);
      } else {
        ctx.fillStyle = '#e8d3ac';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('Drop lettuce / tomato', cx, cy);
        ctx.fillText('to chop', cx, cy + 16);
      }
    } else if (st.kind === STATION_KIND.GRILL) {
      // Grill: dark grate with heat glow; a patty cooks with a progress ring.
      ctx.fillStyle = '#3a3a3a';
      rr(ctx, st.x + 16, st.y + 12, st.w - 32, 58, 8);
      ctx.fill();
      ctx.strokeStyle = '#6b6b6b';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i += 1) {
        const gx = st.x + 30 + i * 44;
        ctx.beginPath();
        ctx.moveTo(gx, st.y + 16);
        ctx.lineTo(gx, st.y + 66);
        ctx.stroke();
      }
      if (st.work) {
        drawIngredientIcon(ctx, st.work.kind, cx, cy - 4, 20);
        drawProgressRing(ctx, cx + 62, cy - 4, 16, st.work.progress / st.work.total, '#ff7a3d');
        ctx.fillStyle = '#ffb347';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText('SIZZLING…', cx, st.y + st.h - 34);
      } else if (st.item) {
        const burnt = st.item === 'burnt-patty';
        drawIngredientIcon(ctx, st.item, cx, cy - 4, 20);
        ctx.fillStyle = burnt ? '#ff8a7a' : '#fff6e3';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText(burnt ? 'BURNT! Trash it' : displayName(st.item), cx, st.y + st.h - 34);
      } else {
        ctx.fillStyle = '#e8d3ac';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('Drop a patty to grill', cx, cy + 4);
      }
    } else if (st.kind === STATION_KIND.PLATE) {
      // A plate: white circle with the stacked ingredients layered on it.
      ctx.fillStyle = '#fdfdfd';
      circle(ctx, cx, cy - 2, 34);
      ctx.fill();
      ctx.strokeStyle = '#d9d9d9';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (st.plate.length === 0) {
        ctx.fillStyle = '#b9a98f';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('Empty plate', cx, st.y + st.h - 34);
      } else {
        // Stack the ingredients as layers so the dish reads mid-assembly.
        const items = st.plate;
        items.forEach((key, i) => {
          drawIngredientIcon(ctx, key, cx, cy - 2 - (items.length - 1 - i) * 7, 20 - i * 1.5);
        });
        ctx.fillStyle = '#fff6e3';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(`${items.length} item${items.length > 1 ? 's' : ''} on plate`, cx, st.y + st.h - 34);
      }
    }
  }
}

function drawChef(ctx, player, kitchen) {
  const bob = player.moving ? Math.sin(player.walkPhase) * 3 : 0;
  const x = player.x;
  const y = player.y + bob * 0.3;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, player.y + 24, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron) and head.
  ctx.fillStyle = '#4a90d9';
  rr(ctx, x - 18, y - 6, 36, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  rr(ctx, x - 12, y + 2, 24, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#f2c79b';
  circle(ctx, x, y - 18, 14);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 15, y - 38, 30, 14, 7);
  ctx.fill();
  circle(ctx, x - 9, y - 38, 8);
  ctx.fill();
  circle(ctx, x + 9, y - 38, 8);
  ctx.fill();
  // Eyes look the way the chef faces.
  ctx.fillStyle = INK;
  circle(ctx, x + player.facing * 4 - 4, y - 18, 2);
  ctx.fill();
  circle(ctx, x + player.facing * 4 + 4, y - 18, 2);
  ctx.fill();
  // What the chef carries, held up high so it reads at a glance.
  if (player.held) {
    const hy = y - 58 + Math.sin(player.walkPhase * 0.5) * 1.5;
    if (typeof player.held === 'object') {
      ctx.fillStyle = '#fdfdfd';
      circle(ctx, x, hy, 20);
      ctx.fill();
      ctx.strokeStyle = '#d9d9d9';
      ctx.lineWidth = 2;
      ctx.stroke();
      player.held.items.forEach((key, i) => {
        drawIngredientIcon(ctx, key, x, hy - (player.held.items.length - 1 - i) * 5, 13);
      });
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      circle(ctx, x, hy, 20);
      ctx.fill();
      drawIngredientIcon(ctx, player.held, x, hy, 17);
    }
  }
}

function drawHint(ctx, player, kitchen, nearby) {
  ctx.fillStyle = 'rgba(36,26,18,0.92)';
  rr(ctx, 16, VIEW.height - 44, VIEW.width - 32, 32, 8);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  let hint = 'WASD / arrows to move · E to use a station · Q to trash · Click a station to walk there · M to mute';
  if (nearby) {
    if (nearby.kind === STATION_KIND.BIN) hint = `Press E to pick up ${INGREDIENTS[nearby.item].name} — or click the bin.`;
    else if (nearby.kind === STATION_KIND.BOARD) hint = 'Chopping board: drop lettuce or tomato here to chop it, then pick it up.';
    else if (nearby.kind === STATION_KIND.GRILL) hint = 'Grill: drop a patty here to cook it — grab it before it burns!';
    else if (nearby.kind === STATION_KIND.PLATE) hint = 'Assembly plate: add prepared ingredients here, then carry the plate to the Serve Window.';
    else if (nearby.kind === STATION_KIND.SERVE) hint = 'Serve Window: press E while carrying a finished plate to serve it.';
    else if (nearby.kind === STATION_KIND.TRASH) hint = 'Trash: press Q (or E here) to throw away what you carry.';
  }
  ctx.fillText(hint, 30, VIEW.height - 23);
}

function drawToasts(ctx, toasts) {
  ctx.textAlign = 'center';
  for (const t of toasts) {
    const alpha = Math.max(0, Math.min(1, t.life / 0.6));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.good ? '#7dc383' : '#ff8a7a';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(t.text, t.x, t.y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍳 SIZZLE RUSH', VIEW.width / 2, 220);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('A tiny kitchen, a full order board, one very busy chef.', VIEW.width / 2, 268);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#e8d3ac';
  ctx.fillText('Grab ingredients, chop and grill them, stack plates, and serve', VIEW.width / 2, 306);
  ctx.fillText('before the tickets run out. Three cold orders and the shift ends.', VIEW.width / 2, 332);
  ctx.fillStyle = '#241a12';
  rr(ctx, VIEW.width / 2 - 190, 380, 380, 64, 14);
  ctx.fill();
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('▶  START SHIFT  (Enter)', VIEW.width / 2, 420);
  ctx.fillStyle = '#c9b8a3';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('WASD / arrows move · E interact · Q trash · mouse click walks you there · P pause · M mute', VIEW.width / 2, 480);
  if (best > 0) {
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`Best shift so far: ★ ${best}`, VIEW.width / 2, 520);
  }
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⏸  PAUSED', VIEW.width / 2, 340);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Press P to keep cooking.', VIEW.width / 2, 380);
  ctx.textAlign = 'left';
}

function drawGameOver(ctx, orders) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍽  SHIFT OVER', VIEW.width / 2, 200);
  ctx.fillStyle = CREAM;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(orders.overReason, VIEW.width / 2, 244);
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(`★ Score: ${orders.score}`, VIEW.width / 2, 310);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#e8d3ac';
  ctx.fillText(`Dishes served: ${orders.served}   ·   Best combo: x${orders.bestCombo}   ·   Orders lost: ${orders.expiredCount}`, VIEW.width / 2, 352);
  const rank = orders.score >= 800 ? 'Head Chef! 👨‍🍳' : orders.score >= 500 ? 'Sous Chef — nearly there!' : orders.score >= 250 ? 'Line Cook — keep practicing!' : 'Dishwasher — the rush got you. Try again!';
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(rank, VIEW.width / 2, 398);
  ctx.fillStyle = '#241a12';
  rr(ctx, VIEW.width / 2 - 190, 440, 380, 60, 14);
  ctx.fill();
  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('↻  COOK AGAIN  (R)', VIEW.width / 2, 478);
  ctx.textAlign = 'left';
}

/** Draw one frame of the game. */
export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawStations(ctx, game.kitchen);
  drawChef(ctx, game.player, game.kitchen);
  drawOrderBoard(ctx, game.orders);
  drawHud(ctx, game.orders, game.screen);
  drawToasts(ctx, game.toasts);
  if (game.screen === SCREEN_PLAY) {
    drawHint(ctx, game.player, game.kitchen, game.nearby);
  }
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game.best);
  if (game.paused) drawPaused(ctx);
  if (game.screen === SCREEN_OVER) drawGameOver(ctx, game.orders);
}
