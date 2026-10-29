import express, { Request, Response } from "express";
import cors from "cors";
import { esClient } from "./config/elasticsearch";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes (cả /api và / để linh hoạt cho gateway và direct access)
app.use("/api", routes);
app.use("/", routes);

// Health check cơ bản của service
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "search-service" });
});

// Health check kiểm tra kết nối tới Elasticsearch
app.get("/health/es", async (req: Request, res: Response) => {
  try {
    const ping = await esClient.ping();
    const clusterHealth = await esClient.cluster.health();

    res.status(200).json({
      status: "ok",
      elasticsearch: {
        connected: ping,
        cluster_name: clusterHealth.cluster_name,
        cluster_status: clusterHealth.status,
        number_of_nodes: clusterHealth.number_of_nodes,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Không thể kết nối đến Elasticsearch",
      error: error.message,
    });
  }
});
// Global error handling middleware
app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: express.NextFunction,
  ) => {
    console.error("[Search Service Error]", err);
    const status = err.status || (err instanceof SyntaxError ? 400 : 500);
    res.status(status).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  },
);

export default app;
