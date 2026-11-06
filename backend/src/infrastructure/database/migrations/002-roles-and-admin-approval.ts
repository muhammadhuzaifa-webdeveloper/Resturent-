import type { mongo } from 'mongoose';
import { User } from '../../../modules/users/user.model';

// Purane roles ko naye roles (client / admin) mein convert karta hai
// aur admin approval ke naye index banata hai.
export const rolesAndAdminApprovalMigration = {
  id: '002-roles-and-admin-approval',
  async up(db: mongo.Db): Promise<void> {
    const users = db.collection('users');
    await users.updateMany({ role: 'customer' }, { $set: { role: 'client', approvalStatus: 'approved' } });
    await users.updateMany(
      { role: { $in: ['restaurant_admin', 'super_admin'] } },
      { $set: { role: 'admin', approvalStatus: 'approved', approvedAt: new Date() } },
    );
    await users.updateMany({ approvalStatus: { $exists: false } }, { $set: { approvalStatus: 'approved' } });
    await User.createIndexes();
  },
};
