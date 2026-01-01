import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { Response } from 'express';
import {
  EncryptJWT,
  jwtDecrypt,
  generateSecret,
  JWTPayload,
} from 'jose';

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
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Verify password
export const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

// Generate Encrypted JWT (JWE)
export const generateEncryptedToken = async (userId: string) => {
  return await new EncryptJWT({ userId })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_MAX_AGE}s`)
    .encrypt(secret);
};

// Decrypt and verify Encrypted JWT
export const verifyEncryptedToken = async (token: string) => {
  try {
    const { payload } = await jwtDecrypt(token, secret);
    return payload as JWTPayload & {user : { id: string, role: string, partnerId: string }};
  } catch (err) {
    return null;
  }
};

// Set encrypted token in cookie
export const setEncryptedAuthCookie = (res: Response, token: string) => {
  const cookie = serialize('access_token', token, {
    maxAge: ACCESS_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    domain:
      process.env.NODE_ENV === 'production'
        ? process.env.COOKIE_DOMAIN
        : 'localhost',
  });

  res.setHeader('Set-Cookie', cookie);
};

// Clear auth cookie
export const clearAuthCookies = (res: Response) => {
  const cookies = [
    serialize('access_token', '', {
      maxAge: -1,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.COOKIE_DOMAIN
          : 'localhost',
    }),
    serialize('deviceId', '', {
      maxAge: -1,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.COOKIE_DOMAIN
          : 'localhost',
    }),
  ];

  res.setHeader('Set-Cookie', cookies);
};
