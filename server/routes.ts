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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 API requests per windowMs
  message: { success: false, error: "Limite de API excedido. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 admin requests per windowMs
  message: { success: false, error: "Limite administrativo excedido. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { success: false, error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const whatsappLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 WhatsApp requests per 5 minutes
  message: { success: false, error: "Limite de solicitações WhatsApp excedido. Tente novamente em 5 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
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

    // Add user info to request
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

  // CORS with production-safe origins
  const corsOptions = {
    origin: process.env.NODE_ENV === "production" 
      ? [/\.render\.com$/, /\.onrender\.com$/]
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

  // Apply API rate limiting to API routes
  app.use("/api", apiLimiter);

  // WhatsApp tracking route (no validation middleware)
  app.post("/track-whatsapp",
    whatsappLimiter,
    [
      body('buttonType')
        .isIn(['plan_subscription', 'doctor_appointment', 'enterprise_quote'])
        .withMessage('Tipo de botão inválido'),
      body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
      body('phone')
        .optional({ nullable: true, checkFalsy: true }),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
      body('planName')
        .optional()
        .isLength({ max: 100 })
        .trim(),
      body('doctorName')
        .optional()
        .isLength({ max: 100 })
        .trim()
    ],
    validateRequest,
    WhatsAppController.createConversion
  );

  app.post("/api/whatsapp/conversions",
    whatsappLimiter,
    [
      body('buttonType')
        .isIn(['plan_subscription', 'doctor_appointment', 'enterprise_quote'])
        .withMessage('Tipo de botão inválido'),
      body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .trim()
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
      body('phone')
        .optional({ nullable: true, checkFalsy: true }),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
      body('planName')
        .optional()
        .isLength({ max: 100 })
        .trim(),
      body('doctorName')
        .optional()
        .isLength({ max: 100 })
        .trim()
    ],
    validateRequest,
    WhatsAppController.createConversion
  );

  // Admin routes
  app.post("/api/admin/login",
    loginLimiter,
    AdminController.login
  );

  app.get("/api/admin/verify", AdminController.verifyToken);

  // Protected admin routes
  app.use("/api/admin", adminLimiter);
  app.use("/api/admin", authenticateAdmin);

  app.get("/api/admin/dashboard/stats", AdminController.getDashboardStats);
  app.get("/api/admin/conversions", WhatsAppController.getConversions);
  app.get("/api/admin/conversions/export", WhatsAppController.exportConversions);

  // Health check routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ready', (req, res) => {
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  });

  app.get('/_health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/metrics', (req, res) => {
    res.json({ 
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
