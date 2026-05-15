// ═══════════════════════════════════════════════════
// SOCKET CLIENT — Frontend
// File: src/lib/socket.ts
// Real-time updates via Socket.IO
// ═══════════════════════════════════════════════════

import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") 
  || "https://golden-beans-server.onrender.com";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected ⚡", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });
  }
  return socket;
}

// Join rooms — safe to call multiple times (server handles dedup)
export function joinPOS()                    { getSocket().emit("join:pos"); }
export function joinKDS()                    { getSocket().emit("join:kds"); }
export function joinTable(tableId: string)   { getSocket().emit("join:table", tableId); }
export function joinWaiter(waiterId: string) { getSocket().emit("join:waiter", waiterId); }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export default getSocket;
