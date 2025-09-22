import db from '../lib/db';


export function addPrompt(prompt: string, imageUrl: string) {
  const stmt = db.prepare('INSERT INTO prompts (prompt, image_url) VALUES (?, ?)');
  const info = stmt.run(prompt, imageUrl);
  return info.lastInsertRowid;
}


export function getPrompts() {
  const stmt = db.prepare('SELECT * FROM prompts ORDER BY created_at DESC');
  const rows = stmt.all();
    return rows.map((row: any) => ({ ...row, image: (row as any).image_url }));
}


export function getPromptById(id: number) {
  const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return undefined;
    return { ...row, image: (row as any).image_url };
}

