import { NextResponse } from "next/server";
import { readPrompts, writePrompts } from "@/lib/storage";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const id = Number(params.id);
  const items = await readPrompts();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = { ...items[idx], ...body, id: items[idx].id };
  await writePrompts(items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const items = await readPrompts();
  const next = items.filter((i) => i.id !== id);
  await writePrompts(next);
  return NextResponse.json({ ok: true });
}