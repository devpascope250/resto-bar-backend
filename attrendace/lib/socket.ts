/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket;

  constructor(url: string, namespace: string = "") {
    this.socket = io(`${url}${namespace}`, {
      transports: ["websocket", "polling"],
      autoConnect: false, // don't connect immediately
    });

    // Setup lifecycle listeners
    this.socket.on("connect", () => {
      console.log("Connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Connect error:", err.message);
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}

// Create a singleton instance (adjust IP + port + namespace!)
export const socketService = new SocketService(
  "http://socket.nepoba.com",
  // "/api/socket/io"
);
