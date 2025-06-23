import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve("dist/public");

  if (!fs.existsSync(distPath)) {
    log(`⚠️  Static files directory not found: ${distPath}`, "vite");
    app.get("*", (_req, res) => {
      res.status(404).json({
        error: "Static files not built",
        message: "Run 'npm run build' first",
      });
    });
    return;
  }

  app.use(
    express.static(distPath, {
      maxAge: process.env.NODE_ENV === "production" ? "1y" : "0",
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
          );
        } else if (
          filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000");
        }
      },
    })
  );

  // Serve SPA routes (exclui rotas de API/health)
  app.get("*", (req, res) => {
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/ready")
    ) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
}

