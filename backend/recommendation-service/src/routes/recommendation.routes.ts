import { Router } from "express";
import { RecommendationController } from "../controllers/recommendation.controller";

const router = Router();
const recommendationController = new RecommendationController();

// QUAN TRỌNG: Các route tĩnh (không có :param) phải đặt TRƯỚC route động /:id
// Nếu đặt sau, Express sẽ bắt "popular" hay "batch" như một :id parameter

// GET /api/recommendations/popular?limit=8&cartIds=id1,id2 — Sản phẩm phổ biến (guest + logged-in)
router.get(
  "/popular",
  recommendationController.getPopularProducts.bind(recommendationController),
);

// GET /api/recommendations/personalized?limit=8&cartIds=id1,id2 — Gợi ý cá nhân hóa (logged-in)
router.get(
  "/personalized",
  recommendationController.getPersonalizedFeed.bind(recommendationController),
);

// POST /api/recommendations/events — Ghi hành vi người dùng (VIEW, ADD_TO_CART)
router.post(
  "/events",
  recommendationController.recordUserEvent.bind(recommendationController),
);

// POST /api/recommendations/batch — Gợi ý tổng hợp từ nhiều sp (hành vi đa dạng)
router.post(
  "/batch",
  recommendationController.getBatchRecommendations.bind(
    recommendationController,
  ),
);

// POST /api/recommendations/log — Ghi log hành vi người dùng (Collaborative Filtering)
router.post(
  "/log",
  recommendationController.logInteraction.bind(recommendationController),
);

// GET /api/recommendations/:id?limit=8 — Gợi ý Hybrid cho 1 sản phẩm (hành vi tập trung)
router.get(
  "/:id",
  recommendationController.getRecommendations.bind(recommendationController),
);

export default router;
