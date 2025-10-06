// // lib/auth.ts
// import { SignJWT, jwtVerify } from 'jose'
// import bcrypt from 'bcryptjs'
// import { NextResponse } from 'next/server'

// const SECRET_KEY = new TextEncoder().encode(
//   process.env.JWT_SECRET || 'your-very-secure-secret-key'
// )
// const MAX_AGE = 60 * 60 * 24 * 7 // 1 week

// export async function hashPassword(password: string) {
//   return await bcrypt.hash(password, 10)
// }

// export async function verifyPassword(password: string, hashedPassword: string) {
//   return await bcrypt.compare(password, hashedPassword)
// }

// export async function generateToken(user: UserAuthPayload) {
//   return await new SignJWT({ user })
//     .setProtectedHeader({ alg: 'HS256' })
//     .setExpirationTime('7d')
//     .setIssuedAt()
//     .sign(SECRET_KEY)
// }

// export function setTokenCookieApp(response: NextResponse, token: string) {
//   response.cookies.set({
//     name: 'myAppToken',
//     value: token,
//     maxAge: MAX_AGE,
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     path: '/',
//     sameSite: 'strict',
//   })
  
//   return response
// }

// export function clearTokenCookie(res: NextResponse) {
//   res.cookies.set({
//     name: 'myAppToken',
//     value: '',
//     maxAge: 0, // Use 0 instead of -1
//     expires: new Date(0), // Explicitly set expiration to past date
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     path: '/',
//     sameSite: 'strict',
//   });
//   return res;
// }

// export async function verifyToken(token: string) {
//   try {
//     const { payload } = await jwtVerify(token, SECRET_KEY)
//     return payload.user as UserAuthPayload
//   } catch (error) {
//     console.log(error)
//     return null
//   }
// }




// lib/auth.ts
import { serialize } from 'cookie'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { EncryptJWT, jwtDecrypt, JWTPayload } from 'jose'

// Constants
const SECRET_KEY = process.env.JWT_SECRET
const ACCESS_MAX_AGE = 60 * 60 * 24 * 2 // 2 days for encrypted JWT
const COOKIE_NAME = 'access_token'

// Validate environment variable
if (!SECRET_KEY) {
  throw new Error('JWT_SECRET must be defined')
}

// Generate AES encryption key
const secret = Buffer.from(SECRET_KEY, 'hex')

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function generateEncryptedToken(user: { id: number, role: Role }) {
  return await new EncryptJWT({ user })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_MAX_AGE}s`)
    .encrypt(secret)
}

export async function verifyEncryptedToken(token: string) {
  try {
    const { payload } = await jwtDecrypt(token, secret)
    return payload as JWTPayload & { user: { id: string, role: Role } }
  } catch (error) {
    console.log('Token verification error:', error)
    return null
  }
}

export function setEncryptedAuthCookie(response: NextResponse, token: string) {
  const cookie = serialize(COOKIE_NAME, token, {
    maxAge: ACCESS_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    domain: process.env.NODE_ENV === 'production' 
      ? process.env.COOKIE_DOMAIN 
      : undefined
  })

  // For NextResponse, we need to set the header directly
  response.headers.append('Set-Cookie', cookie)
  return response
}

export function clearAuthCookies(response: NextResponse) {
  const cookies = [
    serialize(COOKIE_NAME, '', {
      maxAge: -1,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' 
        ? process.env.COOKIE_DOMAIN 
        : undefined
    }),
    serialize('deviceId', '', {
      maxAge: -1,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' 
        ? process.env.COOKIE_DOMAIN 
        : undefined
    })
  ]

  // Set multiple cookies in NextResponse
  cookies.forEach(cookie => {
    response.headers.append('Set-Cookie', cookie)
  })
  return response
}

// Optional: Keep the old functions for backward compatibility or remove them
export async function generateToken(user: { id: number , role: Role}) {
  return await generateEncryptedToken(user)
}

export function setTokenCookieApp(response: NextResponse, token: string) {
  return setEncryptedAuthCookie(response, token)
}

export function clearTokenCookie(response: NextResponse) {
  return clearAuthCookies(response)
}

export async function verifyToken(token: string) {
  const payload = await verifyEncryptedToken(token)
  if (payload && payload.user) {
    return payload.user as UserAuthPayload
  }
  return null
}

// Type definitions
interface UserAuthPayload {
  id: string
  role: Role
}