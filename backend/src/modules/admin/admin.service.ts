import { AppError } from '../../shared/errors/app-error';
import { serializeUser } from '../auth/auth.service';
import type { ApprovalStatus } from '../users/user.model';
import { userRepository } from '../users/user.repository';

type AdminForResponse = Parameters<typeof serializeUser>[0] & {
  approvedBy?: { toString(): string } | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt?: Date;
};

function serializeAdmin(admin: AdminForResponse) {
  return {
    ...serializeUser(admin),
    approvedBy: admin.approvedBy ? admin.approvedBy.toString() : null,
    approvedAt: admin.approvedAt ?? null,
    ...(admin.rejectionReason ? { rejectionReason: admin.rejectionReason } : {}),
    createdAt: admin.createdAt,
  };
}

export const adminService = {
  async listAdmins(filter: { approvalStatus?: ApprovalStatus }, page: number, limit: number) {
    const { items, total } = await userRepository.listAdmins(filter, page, limit);
    return { items: items.map(serializeAdmin), page, limit, total };
  },

  // approved = valid admin, rejected = invalid admin
  async reviewAdmin(
    reviewerId: string,
    targetId: string,
    decision: Exclude<ApprovalStatus, 'pending'>,
    reason?: string,
  ) {
    if (reviewerId === targetId) {
      throw new AppError('You cannot review your own admin account', 403, 'CANNOT_REVIEW_SELF');
    }

    const updated = await userRepository.reviewAdmin(targetId, decision, reviewerId, reason);
    if (updated) return serializeAdmin(updated);

    // Update nahi hua: ya to admin hai hi nahi, ya pehle se isi status mein hai
    const existing = await userRepository.findById(targetId);
    if (!existing || existing.role !== 'admin') throw new AppError('Admin not found', 404, 'ADMIN_NOT_FOUND');
    throw new AppError(`Admin is already ${decision}`, 409, 'ALREADY_REVIEWED');
  },
};
