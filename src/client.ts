import {
  GameLoop,
  init,
  initKeys,
  keyPressed,
  Sprite,
  SpriteSheet,
  TileEngine,
} from "kontra";
import type { Socket } from "socket.io";
import { DEBUG, log } from "./debug";
import {
  NETWORK_EVENT_CONNECT,
  NETWORK_EVENT_DISCONNECT,
  NETWORK_EVENT_UPDATE,
} from "./network";
import { Entity, ENTITY_TYPE_PLAYER, GameState } from "./types";

declare const io: (options: any) => Socket;

// const WIDTH = 1920;
// const HEIGHT = 1080;

export function initClient() {
  let tileEngine: TileEngine;
  let sprite: Sprite;

  // Initialize the websocket to the server
  const socket = io({ upgrade: false, transports: ["websocket"] });

  // Initialize Kontra
  const { context } = init();

  // Load the graphics
  const image = new Image();
  image.src = "i.png";
  image.onload = function () {
    tileEngine = TileEngine({
      // tile size
      tilewidth: 8,
      tileheight: 8,

      // map size in tiles
      width: 8,
      height: 8,

      // tileset object
      tilesets: [
        {
          firstgid: 1,
          image,
        },
      ],

      // layer object
      layers: [
        {
          name: "ground",
          data: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 7, 8, 0, 0, 0, 0, 6, 27, 24,
            24, 25, 0, 0, 0, 0, 23, 24, 24, 24, 26, 8, 0, 0, 0, 23, 24, 24, 24,
            24, 26, 8, 0, 0, 23, 24, 24, 24, 24, 24, 25, 0, 0, 40, 41, 41, 10,
            24, 24, 25, 0, 0, 0, 0, 0, 40, 41, 41, 42, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0,
          ],
        },
      ],
    });

    const spriteSheet = SpriteSheet({
      image,
      frameWidth: 8,
      frameHeight: 8,
      animations: {
        walk: {
          frames: "0..3",
          frameRate: 30,
        },
      },
    });

    sprite = Sprite({
      x: 300,
      y: 100,
      width: 8,
      height: 8,
      // frame
      anchor: { x: 0.5, y: 0.5 },
      image,
      animations: spriteSheet.animations,
    });
  };

  // // Initialize the canvas
  // const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  // const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  // Initialize the player
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

  // function render(now: number): void {
  //   if (keyPressed("arrowleft")) {
  //     player.x--;
  //   } else if (keyPressed("arrowright")) {
  //     player.x++;
  //   }

  //   if (keyPressed("arrowup")) {
  //     player.y--;
  //   } else if (keyPressed("arrowdown")) {
  //     player.y++;
  //   }

  //   context.fillStyle = "black";
  //   context.fillRect(0, 0, WIDTH, HEIGHT);

  //   context.fillStyle = "white";
  //   context.fillText("Time: " + now.toFixed(1), 10, 10);

  //   if (gameState) {
  //     context.fillText("Entities: " + gameState.entities.length, 10, 30);
  //     gameState.entities.forEach((entity) => {
  //       context.fillStyle = "white";
  //       context.fillRect(entity.x, entity.y, 10, 10);
  //     });
  //   } else {
  //     context.fillText("Waiting for server...", 10, 30);
  //   }

  //   if (player) {
  //     context.fillText(`Player: ${player.x}, ${player.y}`, 10, 50);
  //   } else {
  //     context.fillText(`Player not found (${gameState?.currentEntityId})`, 10, 50);
  //   }

  //   requestAnimationFrame(render);
  // }
  // requestAnimationFrame(render);

  const loop = GameLoop({
    update: () => {
      if (keyPressed("arrowleft")) {
        player.x--;
      } else if (keyPressed("arrowright")) {
        player.x++;
      }

      if (keyPressed("arrowup")) {
        player.y--;
      } else if (keyPressed("arrowdown")) {
        player.y++;
      }
      if (sprite) {
        sprite.update();
      }
    },
    render: () => {
      if (tileEngine) {
        tileEngine.render();
      }

      if (sprite) {
        sprite.x = player.x;
        sprite.y = player.y;
        // sprite.width = 8;
        // sprite.height = 8;
        sprite.render();
      }

      // context.fillStyle = "black";
      // context.fillRect(0, 0, WIDTH, HEIGHT);

      context.fillStyle = "white";
      // context.fillText("Time: " + now.toFixed(1), 10, 10);

      if (gameState) {
        context.fillText("Entities: " + gameState.entities.length, 10, 30);
        gameState.entities.forEach((entity) => {
          context.fillStyle = "white";
          context.fillRect(entity.x, entity.y, 10, 10);
        });
      } else {
        context.fillText("Waiting for server...", 10, 30);
      }

      if (player) {
        context.fillText(`Player: ${player.x}, ${player.y}`, 10, 50);
      } else {
        context.fillText(
          `Player not found (${gameState?.currentEntityId})`,
          10,
          50
        );
      }
    },
  });

  loop.start();
}
