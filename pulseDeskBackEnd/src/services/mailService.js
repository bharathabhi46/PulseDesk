import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

const getTransporter = () => {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, html }) => {
  const client = getTransporter();
  if (!client) {
    console.log(`[mail:dev] ${subject} -> ${to}`);
    return;
  }

  await client.sendMail({ from: env.smtp.from, to, subject, html });
};
