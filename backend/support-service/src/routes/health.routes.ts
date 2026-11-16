import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    service: "support-service",
    status: "healthy",
    port: 3009,
    timestamp: new Date().toISOString()
  });
});

export default router;

