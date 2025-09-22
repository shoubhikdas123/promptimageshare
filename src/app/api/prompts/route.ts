
import { NextResponse } from "next/server";
import { addPrompt, getPrompts } from "@/lib/prompts";
import { currentUser, auth } from "@clerk/nextjs/server";


export async function GET() {
  const items = getPrompts();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user || !user.publicMetadata?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  if (!body.prompt || !body.image) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const id = addPrompt(body.prompt, body.image);
  return NextResponse.json({ id, ...body }, { status: 201 });
}