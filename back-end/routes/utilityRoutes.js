import express from 'express';
import { getRegions, getSystemStatus } from '../controllers/foodController';

const router = express.Router();

router.get('/regions', getRegions);
router.get('/status', getSystemStatus);

export default router;
