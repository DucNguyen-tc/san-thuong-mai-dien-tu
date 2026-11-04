import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";

export const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base routes
app.use("/api/support", healthRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[Support Service Error]:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

