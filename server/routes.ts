import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { AdminController } from "./controllers/adminController";
import { WhatsAppController } from "./controllers/whatsappController";
import { PlanController } from "./controllers/planController";
import { SubscriptionController } from "./controllers/subscriptionController";
import { ApiResponse, UnauthorizedError } from "@shared/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secure-secret-key-change-in-production";

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: "Muitas tentativas. Tente novamente em 15 minutos." }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: "Limite de API excedido. Tente novamente em 15 minutos." }
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Limite administrativo excedido. Tente novamente em 15 minutos." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Muitas tentativas de login. Tente novamente em 15 minutos." }
});

const whatsappLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Limite de solicitações WhatsApp excedido. Tente novamente em 5 minutos." }
});

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: "Dados inválidos",
      message: errors.array().map(err => `${err.param}: ${err.msg}`).join(', ')
    };
    return res.status(400).json(response);
  }
  next();
};

// Authentication middleware
const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError("Token de acesso inválido");
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.id || !decoded.username) {
      throw new UnauthorizedError("Token inválido");
    }
    
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      throw new UnauthorizedError("Token expirado");
    }

    (req as any).admin = {
      id: decoded.id,
      username: decoded.username
    };

    next();
  } catch (error) {
    console.error("[Auth] Authentication error:", error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof UnauthorizedError ? error.message : "Erro de autenticação"
    };
    
    res.status(401).json(response);
  }
};

export function createAppServer() {
  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS with production-safe origins including custom domain
  const corsOptions = {
    origin: process.env.NODE_ENV === "production" 
      ? [
          /\.render\.com$/, 
          /\.onrender\.com$/,
          'https://cartaomaisvidah.com.br',
          'https://www.cartaomaisvidah.com.br',
          'https://cartaovidah.com.br'
        ]
      : true,
    credentials: true,
    optionsSuccessStatus: 200
  };
  app.use(cors(corsOptions));

  // Compression for better performance
  app.use(compression());

  // Trust proxy for accurate client IPs
  app.set('trust proxy', 1);

  // Body parsing with security limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false, limit: "10mb" }));

  // Apply general rate limiting to all requests
  app.use(generalLimiter);

  // Health check endpoints
  app.get(['/health', '/ready', '/_health'], (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });

  app.get('/metrics', (req: Request, res: Response) => {
    res.status(200).json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // WhatsApp conversion tracking endpoint (before API middleware)
  app.post('/track-whatsapp', 
    whatsappLimiter,
    [
      body('buttonType').isString().withMessage('buttonType é obrigatório'),
      body('name').optional().isString().withMessage('Nome deve ser uma string'),
      body('email').optional().isEmail().withMessage('Email deve ser válido'),
      body('phone').optional().isString().withMessage('Telefone deve ser uma string'),
      body('planName').optional().isString().withMessage('Nome do plano deve ser uma string'),
      body('doctorName').optional().isString().withMessage('Nome do médico deve ser uma string')
    ],
    validateRequest,
    WhatsAppController.createConversion
  );

  // API routes with rate limiting
  const apiRouter = express.Router();
  apiRouter.use(apiLimiter);

  // Plan routes
  apiRouter.get('/plans', PlanController.getAllPlans);
  apiRouter.get('/plans/:id', PlanController.getPlanById);

  // Subscription routes
  apiRouter.post('/subscriptions', 
    [
      body('customerId').isInt().withMessage('ID do cliente é obrigatório'),
      body('planId').isInt().withMessage('ID do plano é obrigatório'),
      body('paymentMethod').isString().withMessage('Método de pagamento é obrigatório')
    ],
    validateRequest,
    SubscriptionController.createSubscription
  );
  
  apiRouter.get('/subscriptions/:id', SubscriptionController.getSubscriptionById);

  // Admin routes with authentication and additional rate limiting
  const adminRouter = express.Router();
  adminRouter.use(adminLimiter);

  // Admin login (no auth required for login itself)
  adminRouter.post('/login',
    loginLimiter,
    [
      body('username').isString().notEmpty().withMessage('Usuário é obrigatório'),
      body('password').isString().isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
    ],
    validateRequest,
    AdminController.login
  );

  // Protected admin routes
  adminRouter.get('/conversions', authenticateAdmin, AdminController.getConversions);
  adminRouter.get('/conversions/export', authenticateAdmin, AdminController.exportConversions);
  adminRouter.get('/dashboard', authenticateAdmin, AdminController.getDashboard);

  // Mount routers
  app.use('/api', apiRouter);
  app.use('/admin', adminRouter);

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse = {
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : err.message
    };

    res.status(err.status || 500).json(response);
  });

  return app;
}
