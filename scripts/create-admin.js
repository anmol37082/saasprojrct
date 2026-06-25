import dotenv from 'dotenv';
import { connectToDatabase, gracefulShutdown } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';
import { Admin } from '../src/models/Admin.js';

dotenv.config();

const [emailArg, passwordArg, roleArg] = process.argv.slice(2);

const email = String(emailArg || 'admin@example.com').trim().toLowerCase();
const password = String(passwordArg || 'Admin@12345');
const role = String(roleArg || 'platform_admin');

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password> [role]');
  process.exit(1);
}

async function main() {
  await connectToDatabase();

  const passwordHash = await hashPassword(password);

  const admin = await Admin.findOneAndUpdate(
    { email },
    {
      email,
      passwordHash,
      role,
      active: true,
      tenantId: null
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin ready: ${admin.email} / ${password}`);
}

main()
  .then(async () => {
    await gracefulShutdown('seed-complete');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await gracefulShutdown('seed-failed');
    process.exit(1);
  });

