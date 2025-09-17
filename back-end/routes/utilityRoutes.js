import express from 'express';
import getFoodController from '../controllers/getFoodController.js';

const router = express.Router();

router.get('/regions', getFoodController.getRegions);
router.get('/status', getFoodController.getStatus);

export default router;
