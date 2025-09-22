import { NextResponse } from "next/server";
import { readPrompts, writePrompts, type PromptItem } from "@/lib/storage";

export async function GET() {
  const items = await readPrompts();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<PromptItem>;
  if (!body.prompt || !body.image || !body.title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const items = await readPrompts();
  const id = items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
  const item: PromptItem = {
    id,
    title: body.title!,
    prompt: body.prompt!,
    image: body.image!,
    tags: body.tags || [],
    feature: body.feature ?? null,
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  await writePrompts(items);
  return NextResponse.json(item, { status: 201 });
}