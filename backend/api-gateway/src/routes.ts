import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from "./config/env";
import { verifyToken } from "./middlewares/auth.middleware";

const router = Router();

// ==========================================
// Proxy Configuration Helpers
// ==========================================
const proxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path: string, req: any) => {
    return req.originalUrl;
  },
});

// ==========================================
// Public Routes (No Authentication Required)
// ==========================================
// Identity service handles its own public routes like /login, /register
router.use(
  "/auth",
  createProxyMiddleware(proxyOptions(env.IDENTITY_SERVICE_URL)),
);

// Catalog can be viewed publicly (Categories, Products, etc.)
// Note: If some catalog routes (like Create Product) require admin, the downstream service can verify the x-user-role header.
// Or we can split catalog routes here, but typically downstream verifies roles.
router.use(
  "/catalog",
  createProxyMiddleware(proxyOptions(env.CATALOG_SERVICE_URL)),
);

// Recommendations are usually public or use x-user-id if available, but don't force login for browsing
router.use(
  "/recommendations",
  createProxyMiddleware(proxyOptions(env.RECOMMENDATION_SERVICE_URL)),
);

// Payment Return & Callback routes (Public - Browser/Gateway Redirects don't carry JWT Authorization headers)
router.use(
  "/payments/vnpay/return",
  createProxyMiddleware(proxyOptions(env.PAYMENT_SERVICE_URL))
);
router.use(
  "/payments/momo/return",
  createProxyMiddleware(proxyOptions(env.PAYMENT_SERVICE_URL))
);
router.use(
  "/payments/momo/simulator",
  createProxyMiddleware(proxyOptions(env.PAYMENT_SERVICE_URL))
);
router.use(
  "/payments/callback",
  createProxyMiddleware(proxyOptions(env.PAYMENT_SERVICE_URL))
);

// ==========================================
// Protected Routes (Authentication Required)
// ==========================================
// Everything below this line requires a valid JWT token
router.use(verifyToken);

router.use("/cart", createProxyMiddleware(proxyOptions(env.CART_SERVICE_URL)));
router.use(
  "/orders",
  createProxyMiddleware(proxyOptions(env.ORDER_SERVICE_URL)),
);
router.use(
  "/payments",
  createProxyMiddleware(proxyOptions(env.PAYMENT_SERVICE_URL)),
);

export default router;
