import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "prompts.json");

export type PromptItem = {
  id: number;
  title: string;
  prompt: string;
  image: string; // URL or data URI
  tags?: string[];
  // Optional precomputed average color feature for quick visual similarity
  feature?: { r: number; g: number; b: number } | null;
  createdAt: string;
};

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    const seed: PromptItem[] = [
      {
        id: 1,
        title: "Cinematic Landscape",
        prompt:
          "Ultra-wide cinematic shot of misty mountains at sunrise, volumetric lighting, epic composition, 8k",
        image:
          "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop",
        tags: ["landscape", "cinematic", "sunrise"],
        feature: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Product Studio Shot",
        prompt:
          "Minimal studio product shot of a smartwatch on matte surface, soft diffused lighting, high contrast, 35mm lens, f/2.8",
        image:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
        tags: ["product", "studio", "watch"],
        feature: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Portrait Rim Light",
        prompt:
          "Dramatic portrait with strong rim lighting, dark background, shallow depth of field, kodak portra 400 look",
        image:
          "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=1200&q=80&auto=format&fit=crop",
        tags: ["portrait", "rim light", "film"],
        feature: null,
        createdAt: new Date().toISOString(),
      },
    ];
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

export async function readPrompts(): Promise<PromptItem[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as PromptItem[];
}

export async function writePrompts(data: PromptItem[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}