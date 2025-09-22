import db from './db';

// Define the database row type
interface PromptRow {
  id: number;
  prompt: string;
  image_url: string;
  created_at: string;
}

// Define the returned prompt type (with image alias)
interface Prompt extends PromptRow {
  image: string;
}

export function addPrompt(prompt: string, imageUrl: string) {
  const stmt = db.prepare('INSERT INTO prompts (prompt, image_url) VALUES (?, ?)');
  const info = stmt.run(prompt, imageUrl);
  return info.lastInsertRowid;
}

export function getPrompts(): Prompt[] {
  const stmt = db.prepare('SELECT * FROM prompts ORDER BY created_at DESC');
  const rows = stmt.all() as PromptRow[];
  return rows.map((row) => ({ ...row, image: row.image_url }));
}

export function getPromptById(id: number): Prompt | undefined {
  const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?');
  const row = stmt.get(id) as PromptRow | undefined;
  if (!row) return undefined;
  // Keep all original properties AND add the image alias
  return { ...row, image: row.image_url };
}