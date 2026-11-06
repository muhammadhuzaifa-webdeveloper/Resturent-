import { Schema, model, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['client', 'admin'] as const;
export const USER_STATUSES = ['active', 'blocked'] as const;
// 'approved' = valid admin, 'rejected' = invalid admin, 'pending' = review ka intezar
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 32 },
    role: { type: String, enum: USER_ROLES, required: true, default: 'client' },
    status: { type: String, enum: USER_STATUSES, required: true, default: 'active' },
    approvalStatus: { type: String, enum: APPROVAL_STATUSES, required: true, default: 'approved' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    tokenVersion: { type: Number, required: true, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index({ email: 1 }, { unique: true, name: 'users_email_unique' });
userSchema.index({ role: 1, status: 1 }, { name: 'users_role_status' });
userSchema.index({ role: 1, approvalStatus: 1, createdAt: -1 }, { name: 'users_role_approval_created' });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
