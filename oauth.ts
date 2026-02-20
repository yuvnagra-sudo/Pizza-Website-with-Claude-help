// Manus OAuth callback removed — auth is now handled via tRPC auth.login / auth.register
// This file is kept as a no-op so existing imports don't break.
import type { Express } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function registerOAuthRoutes(_app: Express) {
  // No-op: local auth is handled through tRPC procedures
}
