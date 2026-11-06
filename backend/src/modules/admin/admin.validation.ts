import { z } from 'zod';
import { APPROVAL_STATUSES } from '../users/user.model';

export const adminIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid admin id'),
});

export const listAdminsQuerySchema = z.object({
  approvalStatus: z.enum(APPROVAL_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export const approveAdminSchema = z.object({}).strict();

export const rejectAdminSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
}).strict();
