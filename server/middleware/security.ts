import type { Request, Response, NextFunction } from "express";

/**
 * Middleware de segurança que bloqueia IPs suspeitos,
 * mas permite health check da Render.
 */
export function securityMiddleware(req: Request, res: Response, next: NextFunction) {
  const blockedIP = "10.219.27.177";
  const userAgent = req.get("User-Agent") || "";
  const ip = req.ip || req.connection.remoteAddress;

  const isHealthCheck = req.url.startsWith("/health");
  const isRenderAgent = userAgent.includes("Render/1.0");

  const isSafeRenderRequest = isHealthCheck && isRenderAgent;

  if (ip === blockedIP && !isSafeRenderRequest) {
    console.warn("[Security] Bloqueando IP suspeito:", ip);
    return res.status(429).send("Blocked");
  }

  next();
}
