import type { Socket } from "socket.io";
import { log } from "./debug";
import { NETWORK_EVENT_DISCONNECT, NETWORK_EVENT_UPDATE } from "./network";
import { Entity, ENTITY_TYPE_PLAYER, GameState, User } from "./types";
import { removeElement } from "./utils";

export function initServer() {
  const users: User[] = [];

  const gameState: GameState = {
    entities: [],
    events: [],
  };

  let nextEntityId = 1;

  module.exports = (socket: Socket) => {
    const entity: Entity = {
      entityId: nextEntityId++,
      entityType: ENTITY_TYPE_PLAYER,
      x: 0,
      y: 0,
    };
    gameState.entities.push(entity);

    const user: User = { socket, entity, events: [] };
    users.push(user);

    socket.on(NETWORK_EVENT_DISCONNECT, () => {
      log("Disconnected: " + socket.id);
      removeElement(users, user);
      removeElement(gameState.entities, entity);
    });

    socket.on(NETWORK_EVENT_UPDATE, (data: Entity) => {
      if (!data || data.x === undefined || data.y === undefined) {
        return;
      }

      entity.x = data.x;
      entity.y = data.y;
      entity.dx = data.dx;
      entity.dy = data.dy;
      sendUpdate();
    });

    function sendUpdate() {
      socket.emit(NETWORK_EVENT_UPDATE, {
        ...gameState,
        currentEntityId: entity.entityId,
        events: user.events,
      });

      user.events.length = 0;
    }

    sendUpdate();
    log(`Connected: socket=${socket.id}, entity=${entity.entityId}`);
  };
}
