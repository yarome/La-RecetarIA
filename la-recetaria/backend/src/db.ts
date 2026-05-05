import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { SCHEMA_SQL } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath =
  process.env.DATABASE_PATH ?? join(__dirname, '..', 'data', 'la-recetaria.db');

const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(SCHEMA_SQL);
