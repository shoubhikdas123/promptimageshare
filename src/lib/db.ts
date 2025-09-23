
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Table creation (run once, or use migration)
// You may want to run this manually in production, or check if table exists before running.
// await db.execute(`
// CREATE TABLE IF NOT EXISTS prompts (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   prompt TEXT NOT NULL,
//   image_url TEXT NOT NULL,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
// );
// `);

export default db;
