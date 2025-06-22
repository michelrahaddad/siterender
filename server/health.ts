import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
  const healthcheck = {
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    message: 'OK',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      limit: '512MB'
    },
    version: process.version,
    env: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'configured' : 'missing',
    features: {
      cors: true,
      helmet: true,
      compression: true,
      rateLimit: true
    }
  };
  
  try {
    // Quick health checks
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const uptimeSeconds = process.uptime();
    
    if (memoryUsage > 400) { // 400MB limit
      healthcheck.status = 'warning';
      healthcheck.message = 'High memory usage';
    }
    
    if (uptimeSeconds < 5) {
      healthcheck.status = 'starting';
      healthcheck.message = 'Recently started';
    }
    
    res.status(200).json(healthcheck);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

export const readinessCheck = (req: Request, res: Response) => {
  // Verificações básicas de readiness
  const checks = {
    database: true, // Aqui poderia ter verificação real do DB
    memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // 500MB limit
    uptime: process.uptime() > 5 // pelo menos 5 segundos de uptime
  };
  
  const isReady = Object.values(checks).every(check => check);
  
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks,
    timestamp: Date.now()
  });
};