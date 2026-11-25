// Sizzle Rush — configuration: canvas, ingredients, recipes, timings.
// Every number that tunes the game lives here so the rest of the code reads
// like the rules of the kitchen instead of a pile of magic numbers.

export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const ORDER_FIRST_DELAY = 2.5;
export const ORDER_MIN_GAP = 7;
export const ORDER_MAX_GAP = 12;

// An ingredient is a thing the chef can carry. Some need work before they
// can go on a plate: chop turns a raw vegetable into a chopped one, grill
// turns a raw patty into a cooked one (and burns it if left too long).
export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8b06a', dark: '#b97f3e', needs: 'none',  icon: 'bun' },
  patty:   { name: 'Patty',   color: '#a85f4b', dark: '#6e3527', needs: 'grill', icon: 'patty' },
  lettuce: { name: 'Lettuce', color: '#7dc383', dark: '#3f8f4f', needs: 'chop',  icon: 'leaf' },
  tomato:  { name: 'Tomato',  color: '#e2574c', dark: '#a92e26', needs: 'chop',  icon: 'tomato' },
  cheese:  { name: 'Cheese',  color: '#f5c542', dark: '#c99a1e', needs: 'none',  icon: 'cheese' },
};

// A prepared ingredient is the same item after its station work is done.
// 'chopped lettuce' and 'grilled patty' are what recipes actually ask for.
export function preparedKey(kind) {
  if (kind === 'lettuce' || kind === 'tomato') return `chopped-${kind}`;
  if (kind === 'patty') return 'grilled-patty';
  return kind;
}

export function displayName(key) {
  if (key === 'chopped-lettuce') return 'Chopped Lettuce';
  if (key === 'chopped-tomato') return 'Chopped Tomato';
  if (key === 'grilled-patty') return 'Grilled Patty';
  return INGREDIENTS[key] ? INGREDIENTS[key].name : key;
}

export function baseColor(key) {
  if (key === 'chopped-lettuce') return INGREDIENTS.lettuce.color;
  if (key === 'chopped-tomato') return INGREDIENTS.tomato.color;
  if (key === 'grilled-patty') return '#8a4a35';
  return INGREDIENTS[key] ? INGREDIENTS[key].color : '#cccccc';
}

// Recipes: the dishes the order board asks for. Each one is a different
// combination of prepared ingredients, so the chef's route through the
// kitchen changes with every order.
export const RECIPES = [
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    color: '#e8b06a',
    needs: ['bun', 'grilled-patty', 'chopped-lettuce'],
    points: 100,
    time: 45,
  },
  {
    id: 'cheese-burger',
    name: 'Cheese Burger',
    color: '#f5c542',
    needs: ['bun', 'grilled-patty', 'cheese', 'chopped-tomato'],
    points: 140,
    time: 55,
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    color: '#7dc383',
    needs: ['chopped-lettuce', 'chopped-tomato', 'cheese'],
    points: 90,
    time: 40,
  },
  {
    id: 'melt',
    name: 'Patty Melt',
    color: '#d98a4b',
    needs: ['bun', 'grilled-patty', 'cheese'],
    points: 110,
    time: 48,
  },
  {
    id: 'veggie-stack',
    name: 'Veggie Stack',
    color: '#e2574c',
    needs: ['bun', 'chopped-lettuce', 'chopped-tomato', 'cheese'],
    points: 120,
    time: 50,
  },
];

export const CHOP_SECONDS = 1.6;
export const GRILL_SECONDS = 4.0;
export const BURN_SECONDS = 9.0;
export const PLAYER_SPEED = 300;
export const PLAYER_RADIUS = 22;

// Points: a served dish pays its recipe points plus a combo bonus. An order
// served with more than half its time left pays a rush bonus.
export const COMBO_BONUS = 15;
export const RUSH_BONUS = 25;
export const WRONG_SERVE_PENALTY = 0;
