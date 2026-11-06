import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { userRepository } from '../users/user.repository';
import type { UserRole } from '../users/user.model';

const BCRYPT_ROUNDS = 12;

// Email na milne par bhi bcrypt chalta hai, taake response time se pata na chale ke email registered hai ya nahi
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash('dummy-password-for-timing', BCRYPT_ROUNDS);
  return dummyHash;
}

type SerializableUser = {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  approvalStatus: string;
};

export function serializeUser(user: SerializableUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    role: user.role,
    approvalStatus: user.approvalStatus,
  };
}

function createAccessToken(user: { _id: { toString(): string }; role: string; tokenVersion: number }): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    subject: user._id.toString(),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign({ role: user.role, tokenVersion: user.tokenVersion }, env.JWT_SECRET, options);
}

export const authService = {
  async register(input: { name: string; email: string; password: string; phone: string; role: UserRole }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const isAdmin = input.role === 'admin';

    let user;
    try {
      user = await userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone,
        role: input.role,
        // Client foran valid hai; admin ko doosre admin ke approve karne tak pending rakha jata hai
        approvalStatus: isAdmin ? 'pending' : 'approved',
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        throw new AppError('Email is already registered', 409, 'EMAIL_ALREADY_EXISTS');
      }
      throw error;
    }

    // Pending admin ko token nahi milta
    if (isAdmin) return { user: serializeUser(user), accessToken: null };
    return { user: serializeUser(user), accessToken: createAccessToken(user) };
  },

  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email, true);
    const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || user.status !== 'active' || !passwordMatches) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Password sahi hone ke baad hi admin ka approval status bataya jata hai
    if (user.role === 'admin' && user.approvalStatus === 'pending') {
      throw new AppError('Your admin account is awaiting approval from an existing admin', 403, 'ADMIN_PENDING_APPROVAL');
    }
    if (user.role === 'admin' && user.approvalStatus === 'rejected') {
      throw new AppError('Your admin account was rejected as invalid', 403, 'ADMIN_REJECTED');
    }

    return { user: serializeUser(user), accessToken: createAccessToken(user) };
  },

  async logout(userId: string): Promise<void> {
    await userRepository.invalidateTokens(userId);
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || user.status !== 'active') throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return serializeUser(user);
  },

  async updateProfile(userId: string, fields: { name?: string; phone?: string }) {
    const user = await userRepository.updateProfile(userId, fields);
    if (!user || user.status !== 'active') throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return serializeUser(user);
  },

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }): Promise<void> {
    const user = await userRepository.findByIdWithPasswordHash(userId);
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new AppError('Current password is incorrect', 400, 'CURRENT_PASSWORD_INCORRECT');
    }
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    user.tokenVersion += 1;
    await user.save();
  },
};
