import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET ?? 'dev-only-insecure-secret-please-set-JWT_SECRET-in-prod';
const JWT_EXPIRES_IN = '30d';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required in production. Refusing to start.',
  );
}

export interface JwtPayload {
  userId: number;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded !== 'object' || decoded === null || typeof (decoded as JwtPayload).userId !== 'number') {
    throw new Error('Malformed token payload');
  }
  return { userId: (decoded as JwtPayload).userId };
}
