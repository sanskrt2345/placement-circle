'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
const smtpConfigured = Boolean(config.smtp.host && config.smtp.user);

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

/**
 * Sends the signup OTP. Without SMTP settings (local development) the code is
 * printed to the server console instead, so you can still complete signup.
 */
async function sendOtpEmail(to, name, otp) {
  const minutes = config.otp.ttlMinutes;
  if (!transporter) {
    if (config.isProd) throw new Error('SMTP is not configured; cannot send OTP emails in production.');
    console.log(`\n[DEV MAIL] OTP for ${to}: ${otp}  (valid ${minutes} min)\n`);
    return { dev: true };
  }
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: `${otp} is your Placement Circle verification code`,
    text: `Hi ${name},\n\nYour verification code is ${otp}. It expires in ${minutes} minutes.\n\nIf you did not try to sign up, you can ignore this email.\n\n— Placement Circle`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px">
      <h2 style="margin:0 0 12px">Verify your email</h2>
      <p>Hi ${String(name).replace(/[<>&]/g, '')},</p>
      <p>Your Placement Circle verification code is:</p>
      <p style="font-size:32px;letter-spacing:6px;font-weight:700;margin:16px 0">${otp}</p>
      <p style="color:#666">It expires in ${minutes} minutes. If you didn't try to sign up, ignore this email.</p></div>`,
  });
  return { dev: false };
}

module.exports = { sendOtpEmail };
