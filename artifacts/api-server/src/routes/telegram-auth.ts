import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { pool } from "@workspace/db";
import { GetAppSessionResponse } from "@workspace/api-zod";
import { throttle, HttpError } from "../lib/edutop";
import {
  TELEGRAM_SESSION_COOKIE, TELEGRAM_FLOW_COOKIE, sessionCookieOptions,
  telegramCallbackUrl, telegramConfigured, telegramConfigurationError, tokenHash,
} from "../lib/telegram-session";

const router: IRouter = Router();
const jwks = createRemoteJWKSet(new URL("https://oauth.telegram.org/.well-known/jwks.json"), {
  timeoutDuration: 10000, cooldownDuration: 30000,
});

router.get("/auth/session", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(GetAppSessionResponse.parse({
    authenticated: Boolean(req.telegramPrincipal),
    userId: req.telegramPrincipal ?? null,
    displayName: req.telegramDisplayName ?? null,
    telegramConfigured: telegramConfigured(),
    callbackUrl: telegramCallbackUrl(req),
  }));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.[TELEGRAM_SESSION_COOKIE];
  if (typeof token === "string") await pool.query("DELETE FROM telegram_sessions WHERE token_hash=$1", [tokenHash(token)]);
  res.clearCookie(TELEGRAM_SESSION_COOKIE, sessionCookieOptions);
  res.clearCookie(TELEGRAM_FLOW_COOKIE, sessionCookieOptions);
  res.setHeader("Cache-Control", "no-store");
  res.status(204).end();
});

router.get("/auth/telegram/start", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  if (getAuth(req).userId || req.telegramPrincipal) { res.redirect("/dashboard"); return; }
  if (!telegramConfigured()) throw new HttpError(503, telegramConfigurationError());
  await throttle(req, "telegram-login", 30, 60);
  const state = randomBytes(32).toString("hex");
  const browser = randomBytes(32).toString("hex");
  const verifier = randomBytes(48).toString("base64url");
  const nonce = randomBytes(32).toString("hex");
  const redirectUri = telegramCallbackUrl(req);
  await pool.query("DELETE FROM telegram_login_attempts WHERE expires_at<NOW()");
  await pool.query("DELETE FROM telegram_sessions WHERE expires_at<NOW()");
  await pool.query(`INSERT INTO telegram_login_attempts(state_hash,browser_hash,verifier,nonce,redirect_uri,expires_at)
    VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '10 minutes')`, [tokenHash(state), tokenHash(browser), verifier, nonce, redirectUri]);
  res.cookie(TELEGRAM_FLOW_COOKIE, browser, { ...sessionCookieOptions, maxAge: 600000 });
  const authorization = new URL("https://oauth.telegram.org/auth");
  authorization.search = new URLSearchParams({
    client_id: process.env.TELEGRAM_CLIENT_ID!.trim(),
    redirect_uri: redirectUri, response_type: "code", scope: "openid profile",
    state, nonce, code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  res.redirect(authorization.href);
});

router.get("/auth/telegram/callback", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  const fail = (reason: string) => { res.redirect(`/sign-in?telegram_error=${reason}`); };
  const state = req.query.state, code = req.query.code;
  const browser = req.cookies?.[TELEGRAM_FLOW_COOKIE];
  res.clearCookie(TELEGRAM_FLOW_COOKIE, sessionCookieOptions);
  if (typeof state !== "string" || !/^[a-f0-9]{64}$/.test(state) || typeof browser !== "string" || !/^[a-f0-9]{64}$/.test(browser)) {
    fail("invalid_state"); return;
  }
  const attempt = await pool.query(`DELETE FROM telegram_login_attempts
    WHERE state_hash=$1 AND browser_hash=$2 AND expires_at>NOW() RETURNING verifier,nonce,redirect_uri`,
    [tokenHash(state), tokenHash(browser)]);
  if (!attempt.rows[0]) { fail("invalid_state"); return; }
  if (req.query.error || typeof code !== "string" || code.length > 4096) { fail("cancelled"); return; }
  if (!telegramConfigured()) { fail("configuration"); return; }
  const login = attempt.rows[0];
  try {
    const clientId = process.env.TELEGRAM_CLIENT_ID!.trim();
    const secret = process.env.TELEGRAM_CLIENT_SECRET!.trim();
    const tokenResponse = await fetch("https://oauth.telegram.org/token", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}` },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: login.redirect_uri, client_id: clientId, code_verifier: login.verifier }),
    });
    if (!tokenResponse.ok) {
      req.log.warn({ providerStatus: tokenResponse.status }, "Telegram token exchange rejected");
      fail("provider"); return;
    }
    const tokens = await tokenResponse.json() as { id_token?: unknown };
    if (typeof tokens.id_token !== "string") { fail("verification"); return; }
    const { payload } = await jwtVerify(tokens.id_token, jwks, {
      issuer: "https://oauth.telegram.org", audience: clientId,
      algorithms: ["RS256", "ES256"], maxTokenAge: "10 minutes", clockTolerance: 10,
      requiredClaims: ["sub", "iat", "exp", "nonce"],
    });
    if (payload.nonce !== login.nonce || !payload.sub || !/^[a-zA-Z0-9_-]{1,128}$/.test(payload.sub)) {
      fail("verification"); return;
    }
    const principal = `telegram:${payload.sub}`;
    const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 120) : "Telegram foydalanuvchisi";
    const session = randomBytes(32).toString("hex");
    await pool.query(`INSERT INTO telegram_sessions(token_hash,principal,display_name,expires_at)
      VALUES($1,$2,$3,NOW()+INTERVAL '7 days')`, [tokenHash(session), principal, name || "Telegram foydalanuvchisi"]);
    const oldSession = req.cookies?.[TELEGRAM_SESSION_COOKIE];
    if (typeof oldSession === "string") await pool.query("DELETE FROM telegram_sessions WHERE token_hash=$1", [tokenHash(oldSession)]);
    res.cookie(TELEGRAM_SESSION_COOKIE, session, { ...sessionCookieOptions, maxAge: 7 * 86400000 });
    res.redirect("/dashboard");
  } catch {
    // Never log authorization codes, provider tokens, or client credentials.
    req.log.warn("Telegram authorization could not be verified");
    fail("verification");
  }
});

export default router;
