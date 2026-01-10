import express from 'express';
import PicklistController from '../controllers/systemPickList.controller.js';
import { apiLimits } from '../config/rateLimitConfig.js';

const router = express.Router();



router.get('/admin-roles',
  apiLimits,
  PicklistController.getAllAdminRoles
);





export default router;