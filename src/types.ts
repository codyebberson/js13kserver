import type { Socket } from 'socket.io';

export const ENTITY_TYPE_PLAYER = 1;
export const ENTITY_TYPE_BULLET = 2;
export const ENTITY_TYPE_DAMAGE = 3;
export const ENTITY_TYPE_SNAKE = 4;
export const ENTITY_TYPE_SPIDER = 5;
export const ENTITY_TYPE_MESSAGE = 6;

export interface Entity {
  readonly entityType: number;
  entityId?: number;
  parentId?: number;
  events?: Entity[];
  text?: string;
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  health?: number;
  aggroEntityId?: number;
}

export interface GameState {
  readonly entities: Entity[];
  readonly events: Entity[];
  readonly currentEntityId?: number;
}

export interface User {
  readonly socket: Socket;
  readonly entity: Entity;
  readonly events: Entity[];
}
