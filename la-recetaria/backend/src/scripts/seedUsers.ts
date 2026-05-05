import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { hashPassword } from '../auth/password.js';
import { bootstrapUser } from '../services/userBootstrap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedUser {
  email: string;
  password: string;
}

function isSeedUserArray(value: unknown): value is SeedUser[] {
  return (
    Array.isArray(value) &&
    value.every(
      (u) =>
        typeof u === 'object' &&
        u !== null &&
        typeof (u as SeedUser).email === 'string' &&
        typeof (u as SeedUser).password === 'string',
    )
  );
}

function loadSeedUsers(): SeedUser[] {
  const fromEnv = process.env.SEED_USERS;
  if (fromEnv && fromEnv.trim().length > 0) {
    const parsed = JSON.parse(fromEnv);
    if (!isSeedUserArray(parsed)) {
      throw new Error('SEED_USERS must be a JSON array of { email, password }');
    }
    return parsed;
  }
  const localPath = join(__dirname, '..', '..', 'users.local.json');
  const examplePath = join(__dirname, '..', '..', 'users.example.json');
  const path = existsSync(localPath) ? localPath : examplePath;
  if (!existsSync(path)) {
    throw new Error(
      'No SEED_USERS env var and no users.local.json file found. Copy users.example.json to users.local.json and edit it, or set the SEED_USERS env var.',
    );
  }
  const content = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(content);
  if (!isSeedUserArray(parsed)) {
    throw new Error(`File ${path} must contain a JSON array of { email, password }`);
  }
  return parsed;
}

async function main(): Promise<void> {
  const users = loadSeedUsers();
  if (users.length === 0) {
    console.log('No users to seed.');
    return;
  }
  console.log(`Seeding ${users.length} user(s)...`);
  for (const u of users) {
    const email = u.email.toLowerCase().trim();
    if (!email || !u.password) {
      console.warn(`  skipped: missing email or password`);
      continue;
    }
    const hash = await hashPassword(u.password);
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email) as { id: number } | undefined;
    if (existing) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
        hash,
        existing.id,
      );
      bootstrapUser(existing.id);
      console.log(`  updated: ${email} (id=${existing.id})`);
    } else {
      const result = db
        .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
        .run(email, hash);
      const id = Number(result.lastInsertRowid);
      bootstrapUser(id);
      console.log(`  created: ${email} (id=${id})`);
    }
  }
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('seedUsers failed:', err);
    process.exit(1);
  });
