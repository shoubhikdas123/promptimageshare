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

export async function addPrompt(prompt: string, imageUrl: string) {
  const result = await db.execute(
    'INSERT INTO prompts (prompt, image_url) VALUES (?, ?)',
    [prompt, imageUrl]
  );
  // Turso returns lastInsertRowid in result, but may be string
  return result.lastInsertRowid;
}

export async function getPrompts(): Promise<Prompt[]> {
  const result = await db.execute('SELECT * FROM prompts ORDER BY created_at DESC');
  // result.rows is Row[], but we expect PromptRow[]
  const rows = result.rows as unknown as PromptRow[];
  return rows.map((row) => ({ ...row, image: row.image_url }));
}

export async function getPromptById(id: number): Promise<Prompt | undefined> {
  const result = await db.execute('SELECT * FROM prompts WHERE id = ?', [id]);
  const rows = result.rows as unknown as PromptRow[];
  const row = rows[0];
  if (!row) return undefined;
  return { ...row, image: row.image_url };
}