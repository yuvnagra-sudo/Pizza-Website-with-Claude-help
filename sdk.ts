import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  openId: string;
  name: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

class SDKServer {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Register a new user with email + password.
   * Returns the created user record.
   */
  async register(name: string, email: string, password: string): Promise<User> {
    const existing = await db.getUserByEmail(email);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const openId = nanoid();

    // Determine role: auto-promote if ADMIN_EMAIL matches
    const role =
      ENV.adminEmail && email.toLowerCase() === ENV.adminEmail.toLowerCase()
        ? "admin"
        : "user";

    await db.createUser({ openId, name, email, passwordHash, loginMethod: "email", role });

    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create user account.");
    return user;
  }

  /**
   * Verify email + password and return a signed session token.
   */
  async login(email: string, password: string): Promise<string> {
    const user = await db.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return this.createSessionToken(user.openId, { name: user.name ?? "" });
  }

  /**
   * Create a signed JWT session token for a given openId.
   */
  async createSessionToken(
    openId: string,
    options: { name?: string; expiresInMs?: number } = {}
  ): Promise<string> {
    return this.signSession(
      { openId, name: options.name ?? "" },
      { expiresInMs: options.expiresInMs ?? ONE_YEAR_MS }
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({ openId: payload.openId, name: payload.name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing openId");
        return null;
      }

      return { openId, name: isNonEmptyString(name) ? name : "" };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }

    return user;
  }
}

export const sdk = new SDKServer();
