"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.refreshTokens = exports.setAuthCookies = exports.verifyRefreshToken = exports.verifyAccessToken = exports.verifyOtpToken = exports.generateOtpToken = exports.generateRefreshToken = exports.generateAccessToken = exports.verifyPassword = exports.hashPassword = void 0;
const cookie_1 = require("cookie");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days for refresh token
// 15 min for access token (shorter lifespan)
const ACCESS_MAX_AGE = 60 * 15; // 15 minutes for access token
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return await bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
// Updated token generation functions
const generateAccessToken = (userId) => {
    if (!SECRET_KEY)
        throw new Error('No secret key');
    return jsonwebtoken_1.default.sign({ userId }, SECRET_KEY, { expiresIn: ACCESS_MAX_AGE });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    if (!REFRESH_SECRET_KEY)
        throw new Error('No refresh secret key');
    return jsonwebtoken_1.default.sign({ userId }, REFRESH_SECRET_KEY, { expiresIn: REFRESH_MAX_AGE });
};
exports.generateRefreshToken = generateRefreshToken;
// generate otp token
const generateOtpToken = (userId) => {
    if (!SECRET_KEY)
        throw new Error('No secret key');
    return jsonwebtoken_1.default.sign({ userId }, SECRET_KEY, { expiresIn: '10m' }); // 10 minutes for OTP token
};
exports.generateOtpToken = generateOtpToken;
// verify otp token
const verifyOtpToken = (token) => {
    try {
        if (!SECRET_KEY)
            throw new Error('No secret key');
        return jsonwebtoken_1.default.verify(token, SECRET_KEY);
    }
    catch (err) {
        return null;
    }
};
exports.verifyOtpToken = verifyOtpToken;
// verify access token
const verifyAccessToken = (token) => {
    try {
        if (!SECRET_KEY)
            throw new Error('No secret key');
        return jsonwebtoken_1.default.verify(token, SECRET_KEY);
    }
    catch (err) {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
// New function to verify refresh tokens
const verifyRefreshToken = (token) => {
    try {
        if (!REFRESH_SECRET_KEY)
            throw new Error('No refresh secret key');
        return jsonwebtoken_1.default.verify(token, REFRESH_SECRET_KEY);
    }
    catch (err) {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
// Updated cookie setting functions
const setAuthCookies = (res, accessToken, refreshToken) => {
    const accessCookie = (0, cookie_1.serialize)('access_token', accessToken, {
        maxAge: ACCESS_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
    });
    const refreshCookie = (0, cookie_1.serialize)('refresh_token', refreshToken, {
        maxAge: REFRESH_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth/refresh', // Only sent to refresh endpoint
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
    });
    res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
};
exports.setAuthCookies = setAuthCookies;
// New token refresh function
const refreshTokens = (refreshToken) => {
    const decoded = (0, exports.verifyRefreshToken)(refreshToken);
    if (!decoded) {
        throw new Error('Invalid refresh token');
    }
    return {
        accessToken: (0, exports.generateAccessToken)(decoded.userId),
        refreshToken: (0, exports.generateRefreshToken)(decoded.userId) // Optional: rotate refresh token
    };
};
exports.refreshTokens = refreshTokens;
// Updated clear cookies function
const clearAuthCookies = (res) => {
    const cookies = [
        (0, cookie_1.serialize)('access_token', '', {
            maxAge: -1,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
        }),
        (0, cookie_1.serialize)('refresh_token', '', {
            maxAge: -1,
            path: '/api/auth/refresh',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
        }),
        (0, cookie_1.serialize)('deviceId', '', {
            maxAge: -1,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
        })
    ];
    res.setHeader('Set-Cookie', cookies);
};
exports.clearAuthCookies = clearAuthCookies;
