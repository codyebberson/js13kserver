const KEY_COUNT = 256;

export const KEY_ESCAPE = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_A = 65;
export const KEY_D = 68;
export const KEY_M = 77;
export const KEY_Q = 81;
export const KEY_S = 83;
export const KEY_W = 87;
export const KEY_Z = 90;

export interface Key {
  down: boolean;
  downCount: number;
}

/**
 * Array of keyboard keys.
 * @const {!Array.<!Key>}
 */
export const keys = new Array(KEY_COUNT);

export function initKeys(): void {
  for (let i = 0; i < KEY_COUNT; i++) {
    keys[i] = { down: false, downCount: 0 };
  }

  document.addEventListener("keydown", (e) => setKey(e, true));
  document.addEventListener("keyup", (e) => setKey(e, false));
}

function setKey(e: KeyboardEvent, state: boolean): void {
  e.preventDefault();
  e.stopPropagation();
  keys[e.keyCode].down = state;
}

export function updateKeys() {
  for (let i = 0; i < KEY_COUNT; i++) {
    if (keys[i].down) {
      keys[i].downCount++;
    } else {
      keys[i].downCount = 0;
    }
  }
}
