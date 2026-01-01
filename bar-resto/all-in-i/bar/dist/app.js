"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
dotenv_1.default.config();
const productRoute_1 = __importDefault(require("./src/routes/productRoute"));
const seed_1 = __importDefault(require("./src/routes/seed"));
const beverageCategoryRoute_1 = __importDefault(require("./src/routes/beverageCategoryRoute"));
const orderRoute_1 = __importDefault(require("./src/routes/orderRoute"));
const salesRoute_1 = __importDefault(require("./src/routes/salesRoute"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
// cookie parse
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const CacheHeaderAuditor_1 = require("./src/utils/CacheHeaderAuditor");
const redisCache_1 = __importDefault(require("./src/lib/redisCache"));
// import { initializeSocket } from './src/sockets/socketService';
const app = (0, express_1.default)();
// const httpServer = createServer(app);
// const { httpServer } = initializeSocket(app);
// Middleware all many cors in array
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://10.0.2.2:5000', "https://sedulously-forceable-mitch.ngrok-free.dev"], // Add your frontend URLs here
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, // Allow cookies to be sent
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-platform', "ebmtoken"]
}));
app.use((0, compression_1.default)());
app.use(body_parser_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// app.set('etag', false);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // APIs don't need CSP unless serving frontend
    referrerPolicy: { policy: 'no-referrer' }, // safer for API, avoid leaking origin
    frameguard: { action: 'deny' }, // good: block clickjacking
    hidePoweredBy: true, // good: hide Express info
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // good: enforce HTTPS
    noSniff: true, // good: prevent MIME-type sniffing
    ieNoOpen: true, // good: block content download in IE
    dnsPrefetchControl: { allow: false }, // prevent DNS prefetch leaks
    permittedCrossDomainPolicies: { permittedPolicies: "none" } // block Flash-like embedding
}));
app.use((0, cookie_parser_1.default)());
// Middleware to attach Prisma to req
// Add this error handler for Multer specifically
app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});
// route for static
app.use('/images', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
app.use('/api/v1', productRoute_1.default);
app.use('/api/v1/', seed_1.default);
app.use('/api/v1/', beverageCategoryRoute_1.default);
app.use('/api/v1/', orderRoute_1.default);
app.use('/api/v1/', salesRoute_1.default);
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
const auditor = new CacheHeaderAuditor_1.CacheHeaderAuditor();
app.use(auditor.auditMiddleware());
// Later, get reports
app.get('/admin/cache-report', (req, res) => {
    res.json(auditor.getReports());
});
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        await redisCache_1.default.connect();
        console.log('Redis connected successfully');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server due to Redis error:', error);
        process.exit(1);
    }
})();
