import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomState {
  roomId: string;
  updatedAt: number;
  state: Record<string, unknown>;
}

const rooms = new Map<string, RoomState>();
const sseClients = new Map<string, Set<express.Response>>();
const wsRooms = new Map<string, Set<WebSocket>>();

function broadcastToRoom(roomId: string, payload: RoomState, excludeWs?: WebSocket) {
  const message = JSON.stringify({ type: 'room:update', payload });

  // Broadcast to WebSocket clients in room
  const wsSet = wsRooms.get(roomId);
  if (wsSet) {
    for (const client of wsSet) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Broadcast to SSE clients in room
  const sseSet = sseClients.get(roomId);
  if (sseSet) {
    for (const res of sseSet) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Enable CORS so the Android APK (https://localhost) and PRISM Live Web Overlay can sync seamlessly
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  // 1. Get current room state
  app.get('/api/live-room/:roomId', (req, res) => {
    const roomId = (req.params.roomId || 'JALE-2026').toUpperCase();
    const existing = rooms.get(roomId);
    res.json(
      existing || {
        roomId,
        updatedAt: 0,
        state: null,
      }
    );
  });

  // 2. Server-Sent Events (SSE) real-time stream for PRISM Live / Mobile Browsers
  app.get('/api/live-room/:roomId/stream', (req, res) => {
    const roomId = (req.params.roomId || 'JALE-2026').toUpperCase();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!sseClients.has(roomId)) {
      sseClients.set(roomId, new Set());
    }
    sseClients.get(roomId)!.add(res);

    const existing = rooms.get(roomId);
    if (existing) {
      res.write(`data: ${JSON.stringify(existing)}\n\n`);
    }

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.get(roomId)?.delete(res);
    });
  });

  // 3. Update room state via HTTP POST (from Controller Mobile or APK)
  app.post('/api/live-room/:roomId', (req, res) => {
    const roomId = (req.params.roomId || 'JALE-2026').toUpperCase();
    const incomingState = req.body?.state;
    if (!incomingState || typeof incomingState !== 'object') {
      res.status(400).json({ error: 'Invalid state payload' });
      return;
    }

    const nextRoom: RoomState = {
      roomId,
      updatedAt: Date.now(),
      state: incomingState,
    };
    rooms.set(roomId, nextRoom);
    broadcastToRoom(roomId, nextRoom);
    res.json({ ok: true, updatedAt: nextRoom.updatedAt });
  });

  // 4. WebSocket Server for sub-100ms 2-Mobile real-time control
  const wss = new WebSocketServer({ server, path: '/ws-live' });

  wss.on('connection', (ws) => {
    let joinedRoomId = 'JALE-2026';

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === 'room:join' && msg.roomId) {
          wsRooms.get(joinedRoomId)?.delete(ws);
          joinedRoomId = String(msg.roomId).toUpperCase();
          if (!wsRooms.has(joinedRoomId)) {
            wsRooms.set(joinedRoomId, new Set());
          }
          wsRooms.get(joinedRoomId)!.add(ws);

          const existing = rooms.get(joinedRoomId);
          if (existing) {
            ws.send(JSON.stringify({ type: 'room:update', payload: existing }));
          }
        } else if (msg.type === 'room:push' && msg.roomId && msg.state) {
          const rId = String(msg.roomId).toUpperCase();
          const nextRoom: RoomState = {
            roomId: rId,
            updatedAt: Date.now(),
            state: msg.state,
          };
          rooms.set(rId, nextRoom);
          broadcastToRoom(rId, nextRoom, ws);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      wsRooms.get(joinedRoomId)?.delete(ws);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Jale Cricket Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
