import type { Socket } from "socket.io";
import { DEBUG, log } from "./debug";
import {
  initKeys,
  keys,
  KEY_DOWN,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  updateKeys,
} from "./keys";
import {
  NETWORK_EVENT_CONNECT,
  NETWORK_EVENT_DISCONNECT,
  NETWORK_EVENT_UPDATE,
} from "./network";
import { Entity, ENTITY_TYPE_PLAYER, GameState } from "./types";

declare const io: (options: any) => Socket;

const WIDTH = 1920;
const HEIGHT = 1080;

export function initClient() {
  const socket = io({ upgrade: false, transports: ["websocket"] });
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const player: Entity = {
    entityId: 0,
    entityType: ENTITY_TYPE_PLAYER,
    x: 0,
    y: 0,
  };

  let gameState: GameState | undefined = undefined;

  if (DEBUG) {
    socket.on(NETWORK_EVENT_CONNECT, () => log("Connected..."));
    socket.on(NETWORK_EVENT_DISCONNECT, () => log("Disconnected..."));
  }

  socket.on(NETWORK_EVENT_UPDATE, (data: GameState) => {
    if (!data || data.entities === undefined) {
      return;
    }
    gameState = data;
    socket.emit(NETWORK_EVENT_UPDATE, player);
  });

  initKeys();

  function render(now: number): void {
    updateKeys();

    if (keys[KEY_LEFT].down) {
      player.x--;
    }
    if (keys[KEY_RIGHT].down) {
      player.x++;
    }
    if (keys[KEY_UP].down) {
      player.y--;
    }
    if (keys[KEY_DOWN].down) {
      player.y++;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "white";
    ctx.fillText("Time: " + now.toFixed(1), 10, 10);

    if (gameState) {
      ctx.fillText("Entities: " + gameState.entities.length, 10, 30);
      gameState.entities.forEach((entity) => {
        ctx.fillStyle = "white";
        ctx.fillRect(entity.x, entity.y, 10, 10);
      });
    } else {
      ctx.fillText("Waiting for server...", 10, 30);
    }

    if (player) {
      ctx.fillText(`Player: ${player.x}, ${player.y}`, 10, 50);
    } else {
      ctx.fillText(`Player not found (${gameState?.currentEntityId})`, 10, 50);
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
