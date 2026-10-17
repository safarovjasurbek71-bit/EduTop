import { createHash } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { pool } from "@workspace/db";
import { getClerkProxyHost } from "../middlewares/clerkProxyMiddleware";

export const TELEGRAM_SESSION_COOKIE = "__Host-edutop-telegram";
export const TELEGRAM_FLOW_COOKIE = "__Host-edutop-telegram-flow";
export const sessionCookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
export const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");

declare global {
  namespace Express {
    interface Request {
      telegramPrincipal?: string;
      telegramDisplayName?: string;
    }
  }
}

export function telegramConfigured() {
  return /^\d+$/.test(process.env.TELEGRAM_CLIENT_ID?.trim() ?? "") && Boolean(process.env.TELEGRAM_CLIENT_SECRET?.trim());
}

export function telegramConfigurationError(): string {
  if (!process.env.TELEGRAM_CLIENT_ID?.trim()) return "Telegram Client ID kiritilmagan / Не указан Client ID";
  if (!/^\d+$/.test(process.env.TELEGRAM_CLIENT_ID.trim())) return "Telegram Client ID faqat raqamlardan iborat bo‘lishi kerak / Client ID должен содержать только цифры";
  return "Telegram Client Secret kiritilmagan / Не указан Client Secret";
}

export function telegramCallbackUrl(req: Request) {
  const host = getClerkProxyHost(req);
  if (!host || !/^[a-zA-Z0-9.:[\]-]+$/.test(host)) throw new Error("Invalid request host");
  // The public preview and published sites use TLS, including behind the shared proxy.
  return `https://${host}/api/auth/telegram/callback`;
}

export const telegramSessionMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[TELEGRAM_SESSION_COOKIE];
    if (typeof token === "string" && /^[a-f0-9]{64}$/.test(token)) {
      const { rows } = await pool.query("SELECT principal,display_name FROM telegram_sessions WHERE token_hash=$1 AND expires_at>NOW()", [tokenHash(token)]);
      if (rows[0]) {
        req.telegramPrincipal = rows[0].principal;
        req.telegramDisplayName = rows[0].display_name;
      }
    }
    next();
  } catch (error) { next(error); }
};
