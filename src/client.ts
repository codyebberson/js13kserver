import type { Socket } from 'socket.io';
import { DEBUG, log } from './debug';
import {
  initKeys,
  keys,
  KEY_A,
  KEY_D,
  KEY_DOWN,
  KEY_ENTER,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_S,
  KEY_UP,
  KEY_W,
  updateKeys,
} from './keys';
import { NETWORK_EVENT_CONNECT, NETWORK_EVENT_DISCONNECT, NETWORK_EVENT_UPDATE } from './network';
import {
  Entity,
  ENTITY_TYPE_BULLET,
  ENTITY_TYPE_MESSAGE,
  ENTITY_TYPE_PLAYER,
  ENTITY_TYPE_SNAKE,
  ENTITY_TYPE_SPIDER,
  GameState,
} from './types';
import { zzfx } from './zzfx';

declare const io: (options: any) => Socket;

const WIDTH = 240;
const HEIGHT = 135;
const MILLIS_PER_SECOND = 1000;
const FRAMES_PER_SECOND = 30;
const MILLIS_PER_FRAME = MILLIS_PER_SECOND / FRAMES_PER_SECOND;
const PLAYER_SPEED = 2;
const BULLET_SPEED = 4;

export function initClient() {
  const socket = io({ upgrade: false, transports: ['websocket'] });
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  const bufferCanvas = document.createElement('canvas') as HTMLCanvasElement;
  bufferCanvas.width = WIDTH;
  bufferCanvas.height = HEIGHT;

  const bufferCtx = bufferCanvas.getContext('2d') as CanvasRenderingContext2D;

  const image = new Image();
  image.src = 'i.png';
  image.onload = () => {
    for (let y = 0; y < HEIGHT; y += 8) {
      for (let x = 0; x < WIDTH; x += 8) {
        bufferCtx.drawImage(image, 32, 32, 8, 8, x, y, 8, 8);
      }
    }
  };

  const player: Entity = {
    entityId: 0,
    entityType: ENTITY_TYPE_PLAYER,
    events: [],
    x: 16,
    y: 16,
  };

  const target = {
    x: 0,
    y: 0,
  };

  let gameState: GameState | undefined = undefined;

  if (DEBUG) {
    socket.on(NETWORK_EVENT_CONNECT, () => log('Connected...'));
    socket.on(NETWORK_EVENT_DISCONNECT, () => log('Disconnected...'));
  }

  socket.on(NETWORK_EVENT_UPDATE, (data: GameState) => {
    if (!data || data.entities === undefined) {
      return;
    }
    gameState = data;
    for (const event of data.events) {
      if (event.entityType === ENTITY_TYPE_MESSAGE) {
        const sender = data.entities.find((entity) => entity.entityId === event.parentId);
        chat.innerHTML += `<p>[${sender?.text || 'Unknown'}] says: ${event.text}</p>`;
      }
    }
    socket.emit(NETWORK_EVENT_UPDATE, player);
    (player.events as Entity[]).length = 0;
  });

  canvas.addEventListener('click', (e) => {
    zzfx(...[, , 90, , 0.01, 0.03, 4, , , , , , , 9, 50, 0.2, , 0.2, 0.01]);
    target.x = Math.floor(((e.clientX / canvas.offsetWidth) * WIDTH) / 8) * 8;
    target.y = Math.floor(((e.clientY / canvas.offsetHeight) * HEIGHT) / 8) * 8;
    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    sendPlayerEvent({
      entityType: ENTITY_TYPE_BULLET,
      dx: ((target.x - player.x) / dist) * BULLET_SPEED,
      dy: ((target.y - player.y) / dist) * BULLET_SPEED,
    });
  });

  const chat = document.getElementById('chat') as HTMLDivElement;
  const input = document.getElementById('input') as HTMLInputElement;
  input.addEventListener('keydown', (e) => {
    if (e.keyCode === KEY_ENTER) {
      sendPlayerEvent({
        entityType: ENTITY_TYPE_MESSAGE,
        text: input.value,
      });
      input.value = '';
    }
  });

  function sendPlayerEvent(event: Partial<Entity>): void {
    (player.events as Entity[]).push({
      ...event,
      x: player.x,
      y: player.y,
    } as Entity);
  }

  initKeys(canvas);

  function render(): void {
    updateKeys();

    if (keys[KEY_UP].down || keys[KEY_W].down) {
      player.y -= PLAYER_SPEED;
    }
    if (keys[KEY_LEFT].down || keys[KEY_A].down) {
      player.x -= PLAYER_SPEED;
    }
    if (keys[KEY_DOWN].down || keys[KEY_S].down) {
      player.y += PLAYER_SPEED;
    }
    if (keys[KEY_RIGHT].down || keys[KEY_D].down) {
      player.x += PLAYER_SPEED;
    }

    ctx.drawImage(bufferCanvas, 0, 0);

    ctx.fillStyle = 'white';

    if (gameState) {
      gameState.entities.forEach((entity) => {
        let sx = 32;
        let sy = 0;
        if (entity.entityType === ENTITY_TYPE_BULLET) {
          sx = 64;
          sy = 64;
        } else if (entity.entityType === ENTITY_TYPE_SNAKE) {
          sx = 32;
          sy = 8;
        } else if (entity.entityType === ENTITY_TYPE_SPIDER) {
          sx = 88;
          sy = 8;
        }
        ctx.drawImage(image, sx, sy, 8, 8, entity.x | 0, entity.y | 0, 8, 8);
      });
    } else {
      ctx.fillText('Waiting for server...', 2, 10);
    }
  }

  window.setInterval(render, MILLIS_PER_FRAME);
}
