import type { Socket } from 'socket.io';
import { log } from './debug';
import { NETWORK_EVENT_DISCONNECT, NETWORK_EVENT_UPDATE } from './network';
import {
  Entity,
  ENTITY_TYPE_BULLET,
  ENTITY_TYPE_MESSAGE,
  ENTITY_TYPE_PLAYER,
  ENTITY_TYPE_SNAKE,
  ENTITY_TYPE_SPIDER,
  GameState,
  User,
} from './types';
import { removeElement } from './utils';

export function initServer() {
  const users: User[] = [];

  const gameState: GameState = {
    entities: [],
    events: [],
  };

  let nextEntityId = 1;

  function addEntity(entity: Entity): Entity {
    entity.entityId = nextEntityId++;
    entity.health = entity.health || 100;
    gameState.entities.push(entity);
    return entity;
  }

  function doAi(entity: Entity): void {
    if (entity.entityType === ENTITY_TYPE_BULLET) {
      doBulletAi(entity);
    }
    if (entity.entityType === ENTITY_TYPE_SPIDER) {
      doSpiderAi(entity);
    }
  }

  function doBulletAi(entity: Entity): void {
    entity.x += entity.dx as number;
    entity.y += entity.dy as number;

    for (let j = 0; j < gameState.entities.length; j++) {
      const other = gameState.entities[j];
      if (other.entityId !== entity.entityId && other.entityId !== entity.parentId) {
        if (Math.hypot(entity.x - other.x, entity.y - other.y) < 8) {
          entity.health = 0;
          (other.health as number) -= 10;
        }
      }
    }

    (entity.health as number)--;
  }

  function doSpiderAi(entity: Entity): void {
    if (entity.aggroEntityId) {
      // Walk toward the player
      const player = gameState.entities.find((e) => e.entityId === entity.aggroEntityId);
      if (player) {
        if (entity.x < player.x) {
          entity.x += 1;
        } else if (entity.x > player.x) {
          entity.x -= 1;
        }
        if (entity.y < player.y) {
          entity.y += 1;
        } else if (entity.y > player.y) {
          entity.y -= 1;
        }
      } else {
        entity.aggroEntityId = undefined;
      }
    } else {
      const nearest = findNearestPlayer(entity, 40);
      if (nearest) {
        entity.aggroEntityId = nearest.entityId;
      }
    }
  }

  function findNearestPlayer(entity: Entity, maxDistance: number): Entity | undefined {
    let nearest: Entity | undefined = undefined;
    let nearestDistance = maxDistance;

    for (const other of gameState.entities) {
      if (other.entityType === ENTITY_TYPE_PLAYER && other.entityId !== entity.entityId) {
        const distance = Math.hypot(entity.x - other.x, entity.y - other.y);
        if (distance < nearestDistance) {
          nearest = other;
          nearestDistance = distance;
        }
      }
    }

    return nearest;
  }

  addEntity({ entityType: ENTITY_TYPE_SNAKE, x: 200, y: 50, health: 20 });
  addEntity({ entityType: ENTITY_TYPE_SNAKE, x: 200, y: 60, health: 20 });
  addEntity({ entityType: ENTITY_TYPE_SNAKE, x: 200, y: 70, health: 20 });
  addEntity({ entityType: ENTITY_TYPE_SPIDER, x: 220, y: 70, health: 40 });

  // Update the state of all games 30 times per second (every 33 ms).
  setInterval(function () {
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      doAi(entity);
      if ((entity.health as number) <= 0) {
        removeElement(gameState.entities, entity);
        if (entity.entityType === ENTITY_TYPE_SNAKE || entity.entityType === ENTITY_TYPE_SPIDER) {
          setTimeout(() => {
            entity.health = 20;
            entity.aggroEntityId = undefined;
            addEntity(entity);
          }, 10000);
        }
      }
    }
  }, 33);

  module.exports = (socket: Socket) => {
    const entity = addEntity({
      entityType: ENTITY_TYPE_PLAYER,
      text: 'Player' + nextEntityId,
      x: 0,
      y: 0,
    });

    const user: User = { socket, entity, events: [] };
    users.push(user);

    socket.on(NETWORK_EVENT_DISCONNECT, () => {
      log('Disconnected: ' + socket.id);
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

      if (data.events) {
        for (const event of data.events) {
          log('Received event: ' + JSON.stringify(event));
          event.parentId = entity.entityId;
          switch (event.entityType) {
            case ENTITY_TYPE_BULLET:
              addEntity(event);
              break;
            case ENTITY_TYPE_MESSAGE:
              for (const other of users) {
                other.events.push(event);
              }
              break;
          }
        }
      }

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
