import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import { mediaFrontmatterSchema, toMediaItem } from "./schema";
import type { MediaEntry, MediaItem } from "./types";

const contentDir = path.join(process.cwd(), "content", "media");
const generatedIndexPath = path.join(
  process.cwd(),
  ".generated",
  "media-index.json"
);

async function readGeneratedIndex(): Promise<MediaItem[] | null> {
  try {
    const raw = await fs.readFile(generatedIndexPath, "utf8");
    const parsed = JSON.parse(raw) as MediaItem[];
    return parsed.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString(),
    }));
  } catch {
    return null;
  }
}

async function readContentFiles(): Promise<string[]> {
  const entries = await fs.readdir(contentDir);
  return entries.filter((entry) => entry.endsWith(".mdx"));
}

function sortMedia(items: MediaItem[]) {
  return [...items].sort((a, b) => {
    const dateDiff = new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return a.slug.localeCompare(b.slug);
  });
}

async function parseMediaFile(filename: string): Promise<MediaEntry> {
  const slug = filename.replace(/\.mdx$/, "");
  const fullPath = path.join(contentDir, filename);
  const raw = await fs.readFile(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = mediaFrontmatterSchema.parse(data);
  return {
    item: toMediaItem(slug, frontmatter),
    content,
  };
}

export const getMediaIndex = cache(async (): Promise<MediaItem[]> => {
  const generated = await readGeneratedIndex();
  if (generated) {
    return sortMedia(generated);
  }
  const files = await readContentFiles();
  const entries = await Promise.all(files.map(parseMediaFile));
  return sortMedia(entries.map((entry) => entry.item));
});

export const getMediaEntry = cache(async (slug: string): Promise<MediaEntry> => {
  const file = `${slug}.mdx`;
  return parseMediaFile(file);
});

export const getMediaSlugs = cache(async (): Promise<string[]> => {
  const files = await readContentFiles();
  return files.map((file) => file.replace(/\.mdx$/, ""));
});

export async function writeGeneratedIndex(items: MediaItem[]) {
  await fs.mkdir(path.dirname(generatedIndexPath), { recursive: true });
  await fs.writeFile(generatedIndexPath, JSON.stringify(items, null, 2));
}
