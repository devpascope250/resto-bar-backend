// import { sendEmail } from '../utils/mailer';
// import { Prisma, PrismaClient } from '@prisma/client';

// export async function sendResetPasswordEmail(email: string, token: string) {
  
//   const resetLink = `${process.env.CLIENT_URL}/auth/reset-password/${token}/token`;

//   const html = `
//     <h3>Password Reset</h3>
//     <p>Click below to reset your password:</p>
//     <a href="${resetLink}">Reset Password</a>
//   `;

//   await sendEmail(email, 'Reset your password', html);

 
// }

// export async function sendVerificationEmail(prisma: PrismaClient | Prisma.TransactionClient, userId: string, email: string, token: string) {

//   await prisma.verificationToken.create({
//     data: {
//       userId,
//       token,
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr
//     },
//   });

//   const verifyLink = `${process.env.CLIENT_URL}/auth/verify-account/${token}/token`;

//   const html = `
//     <h3>Email Verification</h3>
//     <p>Click the link below to verify your account:</p>
//     <a href="${verifyLink}">Verify Account</a>
//   `;

//   await sendEmail(email, 'Verify your email', html);
// }

// // account has been verified well
// export async function accountVerifiedEmail(email: string) {
//   const html = `
//     <h3>Account Verified</h3>
//     <p>Your account has been successfully verified.</p>
//   `;

//   await sendEmail(email, 'Account Verified', html);
// }

// // send otp email
// export async function sendOtpEmail(email: string, otp: string) {
//   const html = `
//     <h3>OTP Verification</h3>
//     <p>Your OTP is: ${otp}</p>
//   `;

//   await sendEmail(email, 'OTP Verification', html);
// }

// export async function sendPasswordResetSuccessEmail(email: string) {
//   const html = `
//     <h3>Password Reset Successful</h3>
//     <p>Your password has been successfully reset.</p>
//   `;

//   await sendEmail(email, 'Password Reset Successful', html);
  
// }