/* Guessing game engine: a thin transport over PeerJS (WebRTC data channels).
 * The game only uses hostRoom / joinRoom below, so another transport can replace this file. */
(function (root) {
  'use strict';

  // Room ids carry the game's own prefix (game/config.js), so the games never meet on the shared broker.
  const PREFIX = root.GAME.peerPrefix;
  // Static hosting has no signalling server of its own: the page always uses the public PeerJS cloud broker.
  const OPTIONS = { debug: 0 };
  const JOIN_TIMEOUT = 15000;

  function netError(type, cause) {
    const e = new Error(type);
    e.type = type;
    if (cause) e.cause = cause;
    return e;
  }

  /**
   * Opens a room. Resolves with { send(id, msg), broadcast(msg), drop(id), close() } once the broker accepts the id.
   * handlers: onOpen(id), onMessage(id, msg), onClose(id), onError(err)
   */
  function hostRoom(code, handlers) {
    return new Promise((resolve, reject) => {
      if (typeof root.Peer !== 'function') { reject(netError('no-webrtc')); return; }
      const peer = new root.Peer(PREFIX + code, OPTIONS);
      const conns = new Map();
      let ready = false;
      // A channel that is closing can still report open; a failed send must not stop the sends to the others.
      const safeSend = (c, msg) => { try { if (c.open) c.send(msg); } catch (err) { handlers.onError(netError('send', err)); c.close(); } };
      const api = {
        send(id, msg) { const c = conns.get(id); if (c) safeSend(c, msg); },
        broadcast(msg) { conns.forEach(c => safeSend(c, msg)); },
        each(fn) { [...conns.keys()].forEach(id => { const c = conns.get(id); if (c && c.open) fn(id); }); },
        drop(id) { const c = conns.get(id); if (c) c.close(); },
        close() { peer.destroy(); }
      };
      peer.on('open', () => { ready = true; resolve(api); });
      peer.on('connection', conn => {
        conn.on('open', () => { conns.set(conn.peer, conn); handlers.onOpen(conn.peer); });
        conn.on('data', data => handlers.onMessage(conn.peer, data));
        conn.on('close', () => { if (conns.delete(conn.peer)) handlers.onClose(conn.peer); });
        conn.on('error', err => { handlers.onError(netError('connection', err)); if (conns.delete(conn.peer)) handlers.onClose(conn.peer); });
      });
      // Reconnect to the broker only once it gave us an id; a reconnect without one is refused with a 400.
      peer.on('disconnected', () => { if (!peer.destroyed && peer.id) peer.reconnect(); });
      peer.on('error', err => {
        if (!ready) { peer.destroy(); reject(netError(err.type || 'unknown', err)); return; }
        handlers.onError(netError(err.type || 'unknown', err));
      });
    });
  }

  /**
   * Joins a room. Resolves with { send(msg), close() } once the data channel to the host is open.
   * handlers: onMessage(msg), onClose(), onError(err)
   */
  function joinRoom(code, handlers) {
    return new Promise((resolve, reject) => {
      if (typeof root.Peer !== 'function') { reject(netError('no-webrtc')); return; }
      const peer = new root.Peer(OPTIONS);
      let settled = false;
      const timer = setTimeout(() => fail(netError('timeout')), JOIN_TIMEOUT);
      function fail(err) {
        if (settled) { handlers.onError(err); return; }
        settled = true;
        clearTimeout(timer);
        peer.destroy();
        reject(err);
      }
      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
        conn.on('open', () => {
          settled = true;
          clearTimeout(timer);
          resolve({ send(msg) { try { if (conn.open) conn.send(msg); } catch (err) { handlers.onError(netError('send', err)); } }, close() { peer.destroy(); } });
        });
        conn.on('data', data => handlers.onMessage(data));
        conn.on('close', () => { if (settled) handlers.onClose(); });
        conn.on('error', err => fail(netError('connection', err)));
      });
      // Reconnect to the broker only once it gave us an id; a reconnect without one is refused with a 400.
      peer.on('disconnected', () => { if (!peer.destroyed && peer.id) peer.reconnect(); });
      peer.on('error', err => fail(netError(err.type || 'unknown', err)));
    });
  }

  root.HKNet = { hostRoom, joinRoom };
})(window);
