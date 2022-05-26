import type { Socket } from "socket.io";

export const ENTITY_TYPE_PLAYER = 1;
export const ENTITY_TYPE_BULLET = 2;

export interface Entity {
  readonly entityType: number;
  readonly entityId: number;
  events?: Entity[];
  name?: string;
  x: number;
  y: number;
  dx?: number;
  dy?: number;
}

export interface GameState {
  readonly entities: Entity[];
  readonly events: Event[];
  readonly currentEntityId?: number;
}

export interface User {
  readonly socket: Socket;
  readonly entity: Entity;
  readonly events: Entity[];
}
