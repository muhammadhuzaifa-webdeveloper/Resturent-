import type { Types } from 'mongoose';
import { User, type ApprovalStatus, type UserRole } from './user.model';

type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  approvedBy?: Types.ObjectId | string | null;
  approvedAt?: Date | null;
};

export const userRepository = {
  async create(data: NewUser) {
    const user = new User(data);
    await user.save();
    return user;
  },

  findByEmail(email: string, includePasswordHash = false) {
    const query = User.findOne({ email, deletedAt: null });
    if (includePasswordHash) query.select('+passwordHash');
    return query.exec();
  },

  findById(id: string | Types.ObjectId) {
    return User.findOne({ _id: id, deletedAt: null }).exec();
  },

  // Sirf wo fields jo har authenticated request par chahiye (middleware)
  findAuthById(id: string) {
    return User.findOne({ _id: id, deletedAt: null })
      .select('_id role status tokenVersion approvalStatus')
      .exec();
  },

  findByIdWithPasswordHash(id: string) {
    return User.findOne({ _id: id, deletedAt: null }).select('+passwordHash').exec();
  },

  updateProfile(id: string, fields: { name?: string; phone?: string }) {
    return User.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: fields }, {
      new: true,
      runValidators: true,
    }).exec();
  },

  invalidateTokens(id: string) {
    return User.updateOne({ _id: id, deletedAt: null }, { $inc: { tokenVersion: 1 } }).exec();
  },

  async listAdmins(filter: { approvalStatus?: ApprovalStatus }, page: number, limit: number) {
    const query = { role: 'admin', deletedAt: null, ...(filter.approvalStatus ? { approvalStatus: filter.approvalStatus } : {}) };
    const [items, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      User.countDocuments(query).exec(),
    ]);
    return { items, total };
  },

  // Atomic review: sirf tab update hota hai jab target admin ho aur pehle se wahi status na ho.
  reviewAdmin(
    targetId: string,
    decision: Exclude<ApprovalStatus, 'pending'>,
    reviewerId: string,
    reason?: string,
  ) {
    const update: Record<string, unknown> = {
      $set: {
        approvalStatus: decision,
        approvedBy: reviewerId,
        approvedAt: new Date(),
        ...(decision === 'rejected' && reason ? { rejectionReason: reason } : {}),
      },
      ...(decision === 'rejected' ? { $inc: { tokenVersion: 1 } } : {}),
      ...(decision === 'approved' ? { $unset: { rejectionReason: '' } } : {}),
    };
    return User.findOneAndUpdate(
      { _id: targetId, role: 'admin', deletedAt: null, approvalStatus: { $ne: decision } },
      update,
      { new: true },
    ).exec();
  },
};
