
import { NextResponse } from "next/server";
import { getPromptById } from "@/lib/prompts";
import { currentUser, auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

// Option 1: Using the correct type structure (recommended)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user || !user.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const id = Number(resolvedParams.id);
  const prompt = await getPromptById(id);
  if (!prompt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.execute(
    'UPDATE prompts SET prompt = ?, image_url = ? WHERE id = ?',
    [body.prompt ?? prompt.prompt, body.imageUrl ?? prompt.image_url, id]
  );
  return NextResponse.json({ ...prompt, ...body, id });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user || !user.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const id = Number(resolvedParams.id);
  await db.execute('DELETE FROM prompts WHERE id = ?', [id]);
  return NextResponse.json({ ok: true });
}