import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}



declare module 'express' {
  interface Request {
    socketIO?: Server;
  }
}