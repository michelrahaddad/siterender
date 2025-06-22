import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, validateRequestSize, monitorSuspiciousActivity, queryTimeout } from "./security";
import { generalLimiter } from "./middleware/rateLimiting";
import { healthCheck, readinessCheck } from "./health";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandling";
import { performanceMonitoring, getMetricsEndpoint } from "./middleware/monitoring";

const app = express();

// Security headers optimized for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*.onrender.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'", "wss:", "https:", "*.onrender.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS with production-safe origins
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? (origin, callback) => {
        const allowedOrigins = [
          /\.onrender\.com$/,
          /\.render\.com$/,
          'https://cartao-vidah.onrender.com'
        ];
        
        if (!origin) return callback(null, true); // Allow requests with no origin
        
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') return allowed === origin;
          return allowed.test(origin);
        });
        
        callback(null, isAllowed);
      }
    : true,
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Compression for better performance
app.use(compression());

// Performance monitoring
app.use(performanceMonitoring);

// Trust proxy for accurate client IPs (essential for Render)
app.set('trust proxy', true);
app.disable('x-powered-by');

// Additional security middleware
app.use(securityHeaders);
app.use(validateRequestSize);
app.use(monitorSuspiciousActivity);
app.use(queryTimeout(30000)); // 30 second timeout

// Rate limiting is now handled in route modules

// Body parsing with security limits
app.use(express.json({ 
  limit: "10mb",
  verify: (req, res, buf) => {
    if (buf.length > 10 * 1024 * 1024) {
      throw new Error('Request entity too large');
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Health checks (before any other routes)
  app.get('/health', healthCheck);
  app.get('/ready', readinessCheck);
  app.get('/_health', healthCheck); // Alternative endpoint for Render
  app.get('/metrics', getMetricsEndpoint); // Performance metrics

  // Register API routes FIRST, before Vite middleware
  const server = await registerRoutes(app);
  
  console.log('Rotas API registradas');

  if (app.get('env') === 'development') {
    await setupVite(app, server);
    console.log('Vite middleware configurado');
  } else {
    serveStatic(app);
    console.log('Servindo arquivos estáticos');
  }

  // 404 handler for undefined routes
  app.use(notFoundHandler);
  
  // Global error handler
  app.use(globalErrorHandler);

  // Vite setup is already handled above

  // Port configuration for Render
  const port = parseInt(process.env.PORT || "10000", 10);
  const host = "0.0.0.0";
  
  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      log('Server closed.');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      log('Force shutdown');
      process.exit(1);
    }, 30000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  server.listen(port, host, () => {
    const timestamp = new Date().toISOString();
    const startupInfo = {
      timestamp,
      port,
      host,
      mode: process.env.NODE_ENV,
      node_version: process.version,
      process_id: process.pid,
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      static_files: process.env.NODE_ENV === 'production' ? 'dist/public' : 'development',
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      features: {
        security_headers: true,
        cors: true,
        compression: true,
        health_checks: true,
        graceful_shutdown: true
      }
    };
    
    // Structured logging for production monitoring
    console.log(JSON.stringify({
      level: 'info',
      message: 'Server started successfully',
      ...startupInfo
    }));
    
    // Human-readable logs for development
    log(`🚀 Server running on ${host}:${port} in ${process.env.NODE_ENV} mode`);
    log(`📁 Static files: ${startupInfo.static_files}`);
    log(`💾 Database: ${startupInfo.database}`);
    log(`🔒 Security: Headers enabled, CORS configured`);
    log(`📡 Health checks: /health /ready /_health /metrics`);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
})();
