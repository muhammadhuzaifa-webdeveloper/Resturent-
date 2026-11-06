import type { Request, Response } from 'express';
import { AppError } from '../../shared/errors/app-error';
import type { ApprovalStatus } from '../users/user.model';
import { adminService } from './admin.service';

function requireUserId(request: Request): string {
  if (!request.authUser) throw new AppError('Authentication is required', 401, 'AUTHENTICATION_REQUIRED');
  return request.authUser.id;
}

export const adminController = {
  async listAdmins(request: Request, response: Response) {
    const { approvalStatus, page, limit } = request.query as unknown as {
      approvalStatus?: ApprovalStatus;
      page: number;
      limit: number;
    };
    const data = await adminService.listAdmins({ approvalStatus }, page, limit);
    response.status(200).json({ success: true, message: 'Admins fetched successfully', data });
  },

  async approveAdmin(request: Request, response: Response) {
    const data = await adminService.reviewAdmin(requireUserId(request), String(request.params.id), 'approved');
    response.status(200).json({ success: true, message: 'Admin approved as valid', data });
  },

  async rejectAdmin(request: Request, response: Response) {
    const reason = (request.body as { reason?: string }).reason;
    const data = await adminService.reviewAdmin(requireUserId(request), String(request.params.id), 'rejected', reason);
    response.status(200).json({ success: true, message: 'Admin rejected as invalid', data });
  },
};
