/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


// Store connected clients by user ID
const connectedClients = {
  web: new Map(),     // key: userId, value: socket
  mobile: new Map()   // key: userId, value: socket
};
// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Socket.IO server is running!',
    stats: {
      webClients: connectedClients.web.size,
      mobileClients: connectedClients.mobile.size,
      total: connectedClients.web.size + connectedClients.mobile.size
    }
  });
});
io.on('connection', (socket) => {
  console.log('🔥 Client connected:', socket.id);

  // 1. Handle client registration with user ID
  socket.on('register', (data) => {
    const { clientType, userId } = data;
    console.log(`📋 Client ${socket.id} registered as: ${clientType} for user: ${userId}`);
    
    // Store socket with user ID as key
    if (clientType === 'web') {
      connectedClients.web.set(userId, socket);
    } else if (clientType === 'mobile') {
      connectedClients.mobile.set(userId, socket);
    }
    
    // Also store user ID on socket for easy access
    socket.userId = userId;
    socket.clientType = clientType;
  });

  // 2. Send to specific user's web app
  socket.on('webApp', (data) => {
    console.log('📱 Received from mobile:', data);
    
    const targetUserId = data.targetUserId; // The specific user to send to
    const message = data.message;
    
    if (targetUserId) {
      // Send to specific user's web client
      const targetWebSocket = connectedClients.web.get(targetUserId);
      if (targetWebSocket) {
        targetWebSocket.emit('fromMobile', {
          message: message,
          fromUserId: socket.userId, // Who sent it
          fromSocket: socket.id,
          timestamp: new Date().toISOString()
        });
        
        socket.emit('acknowledge', {
          status: 'success',
          message: `Message delivered to user ${targetUserId}`
        });
      } else {
        socket.emit('error', `User ${targetUserId} is not connected via web`);
      }
    } else {
      // Broadcast to all web clients (fallback)
      connectedClients.web.forEach((webSocket, userId) => {
        webSocket.emit('fromMobile', {
          message: message,
          fromUserId: socket.userId,
          fromSocket: socket.id,
          timestamp: new Date().toISOString()
        });
      });
    }
  });

  // 3. Send to specific user's mobile app
  socket.on('mobileApp', (data) => {
    console.log('🌐 Received from web:', data);
    
    const targetUserId = data.targetUserId;
    const message = data.message;
    
    if (targetUserId) {
      const targetMobileSocket = connectedClients.mobile.get(targetUserId);
      if (targetMobileSocket) {
        targetMobileSocket.emit('fromWeb', {
          message: message,
          fromUserId: socket.userId,
          fromSocket: socket.id,
          timestamp: new Date().toISOString()
        });
      } else {
        socket.emit('error', `User ${targetUserId} is not connected via mobile`);
      }
    } else {
      // Broadcast to all mobile clients
      connectedClients.mobile.forEach((mobileSocket, userId) => {
        mobileSocket.emit('fromWeb', {
          message: message,
          fromUserId: socket.userId,
          fromSocket: socket.id,
          timestamp: new Date().toISOString()
        });
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'User:', socket.userId);
    
    // Remove from connected clients using user ID
    if (socket.userId) {
      if (socket.clientType === 'web') {
        connectedClients.web.delete(socket.userId);
      } else if (socket.clientType === 'mobile') {
        connectedClients.mobile.delete(socket.userId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`📡 Accessible via: http://localhost:${PORT}`);
  console.log('🎯 Available events:');
  console.log('   - register (clientType: "web" | "mobile")');
  console.log('   - webApp (from mobile to web)');
  console.log('   - mobileApp (from web to mobile)');
  console.log('   - msg (broadcast to all)');
  console.log('   - directMessage (to specific client)');
});