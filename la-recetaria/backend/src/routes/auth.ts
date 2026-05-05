import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { comparePassword } from '../auth/password.js';
import { signToken } from '../auth/jwt.js';
import { requireAuth } from '../auth/requireAuth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
}

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const { email, password } = parse.data;
  const user = db
    .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .get(email) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = signToken({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email } });
});

router.get('/me', requireAuth, (req, res) => {
  const u = db
    .prepare('SELECT id, email FROM users WHERE id = ?')
    .get(req.user!.id) as { id: number; email: string } | undefined;
  if (!u) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: u });
});

export default router;
