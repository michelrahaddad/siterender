import { createServer } from "http";
import { createAppServer } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

(async () => {
  // Create app server with all routes
  const app = createAppServer();
  
  console.log('Rotas API registradas');

  // Create HTTP server
  const server = createServer(app);

  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
    console.log('Vite middleware configurado');
  } else {
    serveStatic(app);
    console.log('Servindo arquivos estáticos');
  }

  // Error handling middleware
  app.use((err: any, req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    console.error(`[Error] ${status} on ${req.method} ${req.url}:`, {
      message,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    if (status === 500 && process.env.NODE_ENV === "production") {
      message = "Internal Server Error";
    }

    res.status(status).json({ 
      error: message
    });
  });

  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
