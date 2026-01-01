"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.setEncryptedAuthCookie = exports.verifyEncryptedToken = exports.generateEncryptedToken = exports.verifyPassword = exports.hashPassword = void 0;
const cookie_1 = require("cookie");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jose_1 = require("jose");
// Constants
const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ACCESS_MAX_AGE = 60 * 60 * 24 * 2; // 2 days for encrypted JWT
// Generate AES encryption key once
// const encoder = new TextEncoder();
// const secret = encoder.encode(SECRET_KEY); // Must be 32 bytes for A256GCM
if (!SECRET_KEY) {
    throw new Error('JWT_SECRET must be defined');
}
const secret = Buffer.from(SECRET_KEY, 'hex');
// Hash password
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return await bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
// Verify password
const verifyPassword = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
// Generate Encrypted JWT (JWE)
const generateEncryptedToken = async (userId) => {
    return await new jose_1.EncryptJWT({ userId })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_MAX_AGE}s`)
        .encrypt(secret);
};
exports.generateEncryptedToken = generateEncryptedToken;
// Decrypt and verify Encrypted JWT
const verifyEncryptedToken = async (token) => {
    try {
        const { payload } = await (0, jose_1.jwtDecrypt)(token, secret);
        return payload;
    }
    catch (err) {
        return null;
    }
};
exports.verifyEncryptedToken = verifyEncryptedToken;
// Set encrypted token in cookie
const setEncryptedAuthCookie = (res, token) => {
    const cookie = (0, cookie_1.serialize)('access_token', token, {
        maxAge: ACCESS_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production'
            ? process.env.COOKIE_DOMAIN
            : 'localhost',
    });
    res.setHeader('Set-Cookie', cookie);
};
exports.setEncryptedAuthCookie = setEncryptedAuthCookie;
// Clear auth cookie
const clearAuthCookies = (res) => {
    const cookies = [
        (0, cookie_1.serialize)('access_token', '', {
            maxAge: -1,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production'
                ? process.env.COOKIE_DOMAIN
                : 'localhost',
        }),
        (0, cookie_1.serialize)('deviceId', '', {
            maxAge: -1,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production'
                ? process.env.COOKIE_DOMAIN
                : 'localhost',
        }),
    ];
    res.setHeader('Set-Cookie', cookies);
};
exports.clearAuthCookies = clearAuthCookies;
