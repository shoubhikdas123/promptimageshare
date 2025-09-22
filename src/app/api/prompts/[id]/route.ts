import { NextResponse } from "next/server";
import { getPromptById } from "@/lib/prompts";
import { currentUser, auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
export async function PUT(req: Request, context: { params: { id: string } }) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user || !user.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const id = Number(context.params.id);
  const prompt = getPromptById(id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stmt = db.prepare('UPDATE prompts SET prompt = ?, image_url = ? WHERE id = ?');
  stmt.run(body.prompt ?? prompt.prompt, body.imageUrl ?? prompt.image_url, id);
  return NextResponse.json({ ...prompt, ...body, id });
}

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user || !user.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number(context.params.id);
  const stmt = db.prepare('DELETE FROM prompts WHERE id = ?');
  stmt.run(id);
  return NextResponse.json({ ok: true });
}