"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Search, ImagePlus, X, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";

type PromptItem = {
  id: number;
  title: string;
  prompt: string;
  image: string;
  tags?: string[];
  feature?: { r: number; g: number; b: number } | null;
  createdAt: string;
};

function computeAverageColor(img: HTMLImageElement): { r: number; g: number; b: number } {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = Math.min(64, img.naturalWidth || 64));
  const h = (canvas.height = Math.min(64, img.naturalHeight || 64));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { r: 0, g: 0, b: 0 };
  try {
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  } catch {
    return { r: 0, g: 0, b: 0 };
  }}
// ...existing code...

function rgbDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);}
// ...existing code...

function Page() {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [visualPreview, setVisualPreview] = useState<string | null>(null);
  const [visualFeature, setVisualFeature] = useState<{ r: number; g: number; b: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureCache, setFeatureCache] = useState<Record<number, { r: number; g: number; b: number }>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<PromptItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/prompts", { cache: "no-store" });
        const data = (await res.json()) as PromptItem[];
        if (!mounted) return;
        setItems(data);
      } catch {
        setError("Failed to load prompts");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // If a visual query is present, lazily compute missing item features in the background
  useEffect(() => {
    if (!visualFeature) return;
    const missing = items.filter((it) => !it.feature && !featureCache[it.id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates: Record<number, { r: number; g: number; b: number }> = {};
      await Promise.all(
        missing.map(
          (it) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                if (cancelled) return resolve();
                updates[it.id] = computeAverageColor(img);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = it.image;
            })
        )
      );
      if (!cancelled && Object.keys(updates).length) {
        setFeatureCache((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visualFeature, items, featureCache]);

  const handleCopy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const onPickImage = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setVisualPreview(dataUrl);
      const img = new Image();
      img.onload = () => setVisualFeature(computeAverageColor(img));
      img.onerror = () => setVisualFeature(null);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setVisualPreview(null);
    setVisualFeature(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasText = q.length > 0;
    const hasVisual = !!visualFeature;

    const scoreFor = (it: PromptItem) => {
      let score = 0;
      if (hasText) {
        const hay = `${it.title} ${it.prompt} ${(it.tags || []).join(" ")}`.toLowerCase();
        // Simple text scoring
        if (hay.includes(q)) score += 1.5;
        const words = q.split(/\s+/).filter(Boolean);
        score += words.reduce((acc, w) => acc + (hay.includes(w) ? 0.5 : 0), 0);
      }
      if (hasVisual) {
        const feat = it.feature || featureCache[it.id];
        if (feat) {
          const d = rgbDistance(visualFeature!, feat); // 0..441 roughly
          const visualScore = 1.5 - Math.min(d / 300, 1.5); // closer -> higher score up to 1.5
          score += visualScore;
        }
      }
      return score;
    };

    const list = items
      .filter((it) => {
        if (!hasText) return true;
        const hay = `${it.title} ${it.prompt} ${(it.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .map((it) => ({ item: it, score: scoreFor(it) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);

    return list;
  }, [items, query, visualFeature, featureCache]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold">Promptslelo</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Prompt sharing and discovery</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <a href="/admin/login">Admin</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-8">
        <section className="relative mx-auto max-w-5xl min-h-[56vh] py-16 sm:py-24 md:py-28 flex flex-col justify-center">
          {/* Animated futuristic gradient background */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-40 -left-40 h-[60vh] w-[60vh] rounded-full blur-3xl opacity-40"
              style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.35), transparent 65%)" }}
              animate={{ x: [0, 60, -40, 0], y: [0, -30, 40, 0], rotate: [0, 30, -20, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-32 -right-32 h-[65vh] w-[65vh] rounded-full blur-3xl opacity-40"
              style={{ background: "conic-gradient(from 90deg at 50% 50%, rgba(59,130,246,0.28), rgba(34,197,94,0.22), rgba(236,72,153,0.25), rgba(59,130,246,0.28))" }}
              animate={{ x: [0, -50, 30, 0], y: [0, 20, -30, 0], rotate: [0, -25, 15, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative z-10">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">Find the perfect prompt</h1>
              <p className="text-base text-muted-foreground">Search by text or add an image to find visually similar prompts.</p>
            </div>

            <div className="flex items-stretch gap-2 w-full">
              <div className="relative flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search prompts, e.g. cinematic portrait, moody studio, product shot"
                  className="pl-9 h-11"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              <Button variant="secondary" className="h-11" onClick={onPickImage}>
                <ImagePlus className="h-4 w-4 mr-2" /> Image
              </Button>
              {visualPreview && (
                <Button variant="ghost" className="h-11" onClick={clearImage} title="Clear image">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {visualPreview && (
              <div className="mt-3 flex items-center gap-3">
                <img src={visualPreview} alt="query" className="h-12 w-12 rounded object-cover border" />
                {visualFeature && (
                  <div className="text-xs text-muted-foreground">
                    Visual filter active. Weighing color similarity.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-4" />

        <section className="max-w-6xl mx-auto pb-12">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Loading prompts...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((it) => (
                <Card
                  key={it.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedItem(it);
                    setModalOpen(true);
                  }}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={it.image}
                        alt={it.title}
                        className="w-full h-56 object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                        <div className="text-sm font-medium line-clamp-1">{it.title}</div>
                      </div>
                      <div className="absolute right-2 top-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={e => {
                            e.stopPropagation();
                            handleCopy(it.id, it.prompt);
                          }}
                          className="shadow"
                          title="Copy prompt"
                        >
                          {copiedId === it.id ? (
                            <><Check className="h-4 w-4 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="h-4 w-4 mr-1" /> Copy</>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{it.prompt}</p>
                      {it.tags && it.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {it.tags.slice(0, 5).map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground border">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Modal for item details */}
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent
                  className="max-w-md w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-0 flex flex-col"
                  showCloseButton={false}
                >
                  {selectedItem && (
                    <>
                      {/* Mobile: Only close button, rest scrollable */}
                      <div className="flex justify-end p-2 sm:hidden">
                        <DialogClose asChild>
                          <Button size="icon" variant="ghost" aria-label="Close">
                            <X className="h-5 w-5" />
                          </Button>
                        </DialogClose>
                      </div>
                      {/* Desktop: Title, tags, close button */}
                      <div className="hidden sm:block px-6 pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-lg font-semibold mb-1">{selectedItem.title}</div>
                            {selectedItem.tags && selectedItem.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedItem.tags.map((t) => (
                                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground border">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <DialogClose asChild>
                            <Button size="icon" variant="ghost" aria-label="Close">
                              <X className="h-5 w-5" />
                            </Button>
                          </DialogClose>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 pb-6 overflow-y-auto">
                        <img
                          src={selectedItem.image}
                          alt={selectedItem.title}
                          className="w-full h-56 object-cover object-top rounded mb-4 mt-2"
                          crossOrigin="anonymous"
                        />
                        <div className="mb-4 w-full">
                          <p className="text-base whitespace-pre-wrap">{selectedItem.prompt}</p>
                        </div>
                        <div className="flex justify-end w-full">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopy(selectedItem.id, selectedItem.prompt)}
                            className="shadow"
                            title="Copy prompt"
                          >
                            {copiedId === selectedItem.id ? (
                              <><Check className="h-4 w-4 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="h-4 w-4 mr-1" /> Copy</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground">
        Built with Next.js 15 + shadcn/ui. Images from Unsplash.
      </footer>
    </div>
  );
}

export default Page;