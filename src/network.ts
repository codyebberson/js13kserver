/**
 * The event fired by the Socket instance on connection.
 */
export const NETWORK_EVENT_CONNECT = 'connect';

/**
 * The event fired by the Socket instance upon disconnection.
 * See: https://socket.io/docs/v4/server-socket-instance/#disconnect
 */
export const NETWORK_EVENT_DISCONNECT = 'disconnect';

/**
 * Our custom event fired on every client or server update.
 */
export const NETWORK_EVENT_UPDATE = 'u';
