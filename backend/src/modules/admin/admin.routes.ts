import { Router } from 'express';
import { asyncHandler } from '../../shared/http/async-handler';
import { validateBody } from '../../shared/http/validate-body';
import { validateParams, validateQuery } from '../../shared/http/validate-request';
import { authenticate, authorize } from '../auth/auth.middleware';
import { adminController } from './admin.controller';
import { adminIdParamSchema, approveAdminSchema, listAdminsQuerySchema, rejectAdminSchema } from './admin.validation';

const router = Router();

// Sirf approved admin hi in routes tak pahunch sakta hai
router.use(authenticate, authorize('admin'));

router.get('/admins', validateQuery(listAdminsQuerySchema), asyncHandler(adminController.listAdmins));
router.patch(
  '/admins/:id/approve',
  validateParams(adminIdParamSchema),
  validateBody(approveAdminSchema),
  asyncHandler(adminController.approveAdmin),
);
router.patch(
  '/admins/:id/reject',
  validateParams(adminIdParamSchema),
  validateBody(rejectAdminSchema),
  asyncHandler(adminController.rejectAdmin),
);

export { router as adminRoutes };
