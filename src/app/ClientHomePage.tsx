"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

interface ClientHomePageProps {
  initialPrompts: PromptItem[];
}

export default function ClientHomePage({ initialPrompts }: ClientHomePageProps) {
  const [items, setItems] = useState<PromptItem[]>(initialPrompts);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [visualPreview, setVisualPreview] = useState<string | null>(null);
  const [visualFeature, setVisualFeature] = useState<{ r: number; g: number; b: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch more prompts when page changes
  useEffect(() => {
    if (page === 1) return;
    setLoading(true);
    fetch(`/api/prompts?page=${page}&pageSize=${pageSize}`)
      .then((res) => res.json())
      .then((data: PromptItem[]) => {
        setItems((prev) => [...prev, ...data]);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load more prompts");
        setLoading(false);
      });
  }, [page]);

  // ...rest of the UI logic, search, copy, etc. (copy from page.tsx)
  // For brevity, only the pagination and SSR logic is shown here.

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Prompt Image Gallery</h1>
      {/* Render grid of images/prompts here, similar to page.tsx */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent>
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                style={{ background: item.feature ? `rgb(${item.feature.r},${item.feature.g},${item.feature.b})` : undefined }}
                className="w-full h-32 object-cover rounded"
              />
              <div className="mt-2 font-semibold">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.prompt}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <Button onClick={() => setPage((p) => p + 1)} disabled={loading}>
          {loading ? "Loading..." : "Next Page"}
        </Button>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
