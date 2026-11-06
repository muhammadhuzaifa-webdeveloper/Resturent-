import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import { userRepository } from '../../modules/users/user.repository';
import { connectDatabase, disconnectDatabase } from './mongoose';

// Pehla admin: koi pehle se approved admin nahi hota jo usay approve kare,
// isliye usay yahan se seed kiya jata hai.
async function seedAdmin(): Promise<void> {
  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = env;
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_EMAIL aur SEED_ADMIN_PASSWORD .env mein set karein');
  }

  await connectDatabase();
  const existing = await userRepository.findByEmail(SEED_ADMIN_EMAIL);
  if (existing) {
    if (existing.role === 'admin' && existing.approvalStatus === 'approved') {
      logger.info({ email: SEED_ADMIN_EMAIL }, 'Approved admin already exists');
      return;
    }
    throw new Error(`${SEED_ADMIN_EMAIL} pehle se maujood hai magar approved admin nahi hai`);
  }

  await userRepository.create({
    name: SEED_ADMIN_NAME ?? 'First Admin',
    email: SEED_ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12),
    role: 'admin',
    approvalStatus: 'approved',
    approvedAt: new Date(),
  });
  logger.info({ email: SEED_ADMIN_EMAIL }, 'First admin created');
}

void seedAdmin()
  .catch((error: unknown) => {
    logger.fatal({ err: error }, 'Admin seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
