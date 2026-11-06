import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import ticketRoutes from "./routes/ticket.routes";

export const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BigInt JSON serializer support (cho bảng có BigInt ID như ticket_messages)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Base routes
app.use("/api/support", healthRoutes);
app.use("/api/support/tickets", ticketRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[Support Service Error]:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});
