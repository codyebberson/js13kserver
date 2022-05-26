/**
 * The event fired by the Socket instance on connection.
 * @const {string}
 */
export const NETWORK_EVENT_CONNECT = "connect";

/**
 * The event fired by the Socket instance upon disconnection.
 * See: https://socket.io/docs/v4/server-socket-instance/#disconnect
 * @const {string}
 */
export const NETWORK_EVENT_DISCONNECT = "disconnect";

/**
 * Our custom event fired on every client or server update.
 * @const {string}
 */
export const NETWORK_EVENT_UPDATE = "u";
