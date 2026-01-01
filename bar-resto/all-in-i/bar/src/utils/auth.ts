import { serialize } from 'cookie'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Response } from 'express';

const SECRET_KEY = process.env.JWT_SECRET!;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days for refresh token
 // 15 min for access token (shorter lifespan)
const ACCESS_MAX_AGE = 60 * 15; // 15 minutes for access token

export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt);
}

export const verifyPassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
}

// Updated token generation functions
export const generateAccessToken = (userId: string) => {
    if(!SECRET_KEY) throw new Error('No secret key');
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: ACCESS_MAX_AGE });
};

export const generateRefreshToken = (userId: string) => {
    if(!REFRESH_SECRET_KEY) throw new Error('No refresh secret key');
    return jwt.sign({ userId }, REFRESH_SECRET_KEY, { expiresIn: REFRESH_MAX_AGE });
};
// generate otp token
export const generateOtpToken = (userId: string) => {
    if(!SECRET_KEY) throw new Error('No secret key');
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '10m' }); // 10 minutes for OTP token
};
// verify otp token
export const verifyOtpToken = (token: string) => {
    try{
        if(!SECRET_KEY) throw new Error('No secret key');
    return jwt.verify(token, SECRET_KEY) as { userId: string };
    }catch(err){
        return null;
    }
}
// verify access token
export const verifyAccessToken = (token: string) => {
    try {
        if(!SECRET_KEY) throw new Error('No secret key');
        return jwt.verify(token, SECRET_KEY) as { userId: string };
    } catch (err) {
        return null;
    }
}

// New function to verify refresh tokens
export const verifyRefreshToken = (token: string) => {
    try {
        if(!REFRESH_SECRET_KEY) throw new Error('No refresh secret key');
        return jwt.verify(token, REFRESH_SECRET_KEY) as { userId: string };
    } catch (err) {
        return null;
    }
};

// Updated cookie setting functions
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const accessCookie = serialize('access_token', accessToken, {
        maxAge: ACCESS_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
    });

    const refreshCookie = serialize('refresh_token', refreshToken, {
        maxAge: REFRESH_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth/refresh', // Only sent to refresh endpoint
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
    });

    res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
};

// New token refresh function
export const refreshTokens = (refreshToken: string) => {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        throw new Error('Invalid refresh token');
    }

    return {
        accessToken: generateAccessToken(decoded.userId),
        refreshToken: generateRefreshToken(decoded.userId) // Optional: rotate refresh token
    };
};

// Updated clear cookies function
export const clearAuthCookies = (res: Response) => {
    const cookies = [
        serialize('access_token', '', {
            maxAge: -1,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
        }),
        serialize('refresh_token', '', {
            maxAge: -1,
            path: '/api/auth/refresh',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost',
        }),
        serialize('deviceId', '', {
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