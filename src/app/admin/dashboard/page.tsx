"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PromptItem = {
  id: number;
  title: string;
  prompt: string;
  image: string;
  tags?: string[];
  feature?: { r: number; g: number; b: number } | null;
  createdAt: string;
};

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function computeAverageColor(img: HTMLImageElement): { r: number; g: number; b: number } {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = Math.min(64, img.naturalWidth || 64));
  const h = (canvas.height = Math.min(64, img.naturalHeight || 64));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { r: 0, g: 0, b: 0 };
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<PromptItem[]>([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authed = typeof window !== "undefined" && localStorage.getItem("promptslelo_admin_authed") === "1";
    if (!authed) router.replace("/admin/login");
  }, [router]);

  const load = async () => {
    const res = await fetch("/api/prompts", { cache: "no-store" });
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImage = imageUrl;
      if (imageFile) {
        finalImage = await fileToDataURL(imageFile);
      }
      let feature: { r: number; g: number; b: number } | null = null;
      if (finalImage) {
        feature = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(computeAverageColor(img));
          img.onerror = () => resolve({ r: 0, g: 0, b: 0 });
          img.src = finalImage;
        });
      }
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          prompt,
          image: finalImage,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          feature,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setTitle("");
      setPrompt("");
      setTags("");
      setImageUrl("");
      setImageFile(null);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Promptslelo Admin</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load}>Refresh</Button>
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.removeItem("promptslelo_admin_authed");
              router.replace("/admin/login");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short name for the prompt" required />
              </div>
              <div>
                <label className="text-sm font-medium">Prompt</label>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} placeholder="Enter the full prompt" required />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="portrait, studio, moody" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Image URL (Unsplash or any)</label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." />
              </div>
              <div>
                <label className="text-sm font-medium">Or Upload Image</label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>
              <div className="text-xs text-muted-foreground">If both provided, uploaded file takes precedence.</div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add Prompt"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <CardHeader>
              <CardTitle className="text-base">{it.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={it.image} alt={it.title} className="w-full h-48 object-cover rounded-md" />
              <p className="mt-3 text-sm line-clamp-3 whitespace-pre-wrap">{it.prompt}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(it.prompt)}
              >
                Copy Prompt
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(it.id)}>Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}