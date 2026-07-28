import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';

const router = Router();
const recommendationController = new RecommendationController();

router.get('/:id', recommendationController.getRecommendations.bind(recommendationController));
router.post('/log', recommendationController.logInteraction.bind(recommendationController));

export default router;
