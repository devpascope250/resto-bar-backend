import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
dotenv.config();
import productRoute from './src/routes/productRoute';
import seedRouter from './src/routes/seed'
import bvgCatRouter from './src/routes/beverageCategoryRoute'
import orederRoute from './src/routes/orderRoute'
import salesRoute from './src/routes/salesRoute';
import seed from './src/routes/seed';
import cors from 'cors';
import bodyParser from 'body-parser';
// cookie parse
import cookieParse from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import cron from 'node-cron';
import { CacheHeaderAuditor } from './src/utils/CacheHeaderAuditor';
import redisCache from "./src/lib/redisCache";
// import { initializeSocket } from './src/sockets/socketService';
const app = express();
// const httpServer = createServer(app);
// const { httpServer } = initializeSocket(app);

// Middleware all many cors in array
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://10.0.2.2:5000', "https://sedulously-forceable-mitch.ngrok-free.dev"], // Add your frontend URLs here
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-platform', "ebmtoken"]
}));
app.use(compression());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// app.set('etag', false);

app.use(helmet({
  contentSecurityPolicy: false, // APIs don't need CSP unless serving frontend
  referrerPolicy: { policy: 'no-referrer' }, // safer for API, avoid leaking origin
  frameguard: { action: 'deny' },            // good: block clickjacking
  hidePoweredBy: true,                       // good: hide Express info
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // good: enforce HTTPS
  noSniff: true,                             // good: prevent MIME-type sniffing
  ieNoOpen: true,                            // good: block content download in IE
  dnsPrefetchControl: { allow: false },      // prevent DNS prefetch leaks
  permittedCrossDomainPolicies: { permittedPolicies: "none" } // block Flash-like embedding
}));
app.use(cookieParse());

// Middleware to attach Prisma to req

// Add this error handler for Multer specifically
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
// route for static
app.use('/images', express.static(path.join(__dirname, 'uploads')));
app.use('/api/v1', productRoute);
app.use('/api/v1/', seedRouter);
app.use('/api/v1/', bvgCatRouter);
app.use('/api/v1/', orederRoute);
app.use('/api/v1/', salesRoute);

// Routes
app.get('/', (req, res) => {
  // get token from cookies
  // const token = req.cookies.log_token || req.headers.authorization?.split(' ')[1];
  // if (!token) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }
  res.status(200).json({ message: 'Welcome to the Bar Management API' });
});

// cron.schedule('55 23 * * *', async () => {
//     try {
//         console.log('Generating daily stock snapshots for all partners...');

//         const partners = await prisma.partner.findMany({
//             where: { deletedAt: null }
//         });

//         for (const partner of partners) {
//             await createDailyStockSnapshot(partner.id);
//         }

//         console.log(`Daily stock snapshots generated for ${partners.length} partners`);
//     } catch (error) {
//         console.error('Error generating daily snapshots:', error);
//     }
// });

const auditor = new CacheHeaderAuditor();
app.use(auditor.auditMiddleware());

// Later, get reports
app.get('/admin/cache-report', (req, res) => {
  res.json(auditor.getReports());
});


const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await redisCache.connect(); console.log('Redis connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to Redis error:', error); process.exit(1);
  }
})();