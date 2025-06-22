import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  slowRequests: number;
  lastReset: Date;
}

class MetricsCollector {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorCount: 0,
    slowRequests: 0,
    lastReset: new Date()
  };

  private responseTimes: number[] = [];

  logRequest(responseTime: number, statusCode: number) {
    this.metrics.requestCount++;
    this.responseTimes.push(responseTime);

    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    if (statusCode >= 400) {
      this.metrics.errorCount++;
    }

    if (responseTime > 5000) { // 5 seconds
      this.metrics.slowRequests++;
    }

    // Reset metrics every hour
    const now = new Date();
    const hoursSinceReset = (now.getTime() - this.metrics.lastReset.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReset >= 1) {
      this.resetMetrics();
    }
  }

  private resetMetrics() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      slowRequests: 0,
      lastReset: new Date()
    };
    this.responseTimes = [];
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

const metricsCollector = new MetricsCollector();

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metricsCollector.logRequest(responseTime, res.statusCode);

    // Structured logging for all requests
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      response_time_ms: responseTime,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      level: res.statusCode >= 400 ? 'error' : (responseTime > 3000 ? 'warn' : 'info')
    };

    if (responseTime > 3000) {
      console.warn(JSON.stringify({
        ...logEntry,
        message: 'Slow request detected'
      }));
    }

    if (res.statusCode >= 400) {
      console.error(JSON.stringify({
        ...logEntry,
        message: 'Error response'
      }));
    }
  });

  next();
};

export const getMetricsEndpoint = (req: Request, res: Response) => {
  const metrics = metricsCollector.getMetrics();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    metrics,
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
    platform: process.platform,
    nodeVersion: process.version
  });
};