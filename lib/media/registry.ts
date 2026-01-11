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
const soraSyncEndpoint = process.env.SORA_SYNC_ENDPOINT;
const soraSyncToken = process.env.SORA_SYNC_TOKEN;

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

function parseMediaBody(slug: string, raw: string): MediaEntry {
  const { data, content } = matter(raw);
  const frontmatter = mediaFrontmatterSchema.parse(data);
  return {
    item: toMediaItem(slug, frontmatter),
    content,
  };
}

async function readRemoteEntries(): Promise<MediaEntry[] | null> {
  if (!soraSyncEndpoint || !soraSyncToken) {
    return null;
  }

  const response = await fetch(soraSyncEndpoint, {
    headers: {
      Authorization: `Bearer ${soraSyncToken}`,
    },
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`Sora sync failed: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    slug: string;
    body: string;
  }>;

  return payload.map((entry) => parseMediaBody(entry.slug, entry.body));
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
  return parseMediaBody(slug, raw);
}

export const getMediaIndex = cache(async (): Promise<MediaItem[]> => {
  const remoteEntries = await readRemoteEntries();
  if (remoteEntries) {
    return sortMedia(remoteEntries.map((entry) => entry.item));
  }
  const generated = await readGeneratedIndex();
  if (generated) {
    return sortMedia(generated);
  }
  const files = await readContentFiles();
  const entries = await Promise.all(files.map(parseMediaFile));
  return sortMedia(entries.map((entry) => entry.item));
});

export const getMediaEntry = cache(async (slug: string): Promise<MediaEntry> => {
  const remoteEntries = await readRemoteEntries();
  if (remoteEntries) {
    const entry = remoteEntries.find((item) => item.item.slug === slug);
    if (!entry) {
      throw new Error(`Media entry not found: ${slug}`);
    }
    return entry;
  }
  const file = `${slug}.mdx`;
  return parseMediaFile(file);
});

export const getMediaSlugs = cache(async (): Promise<string[]> => {
  const remoteEntries = await readRemoteEntries();
  if (remoteEntries) {
    return remoteEntries.map((entry) => entry.item.slug);
  }
  const files = await readContentFiles();
  return files.map((file) => file.replace(/\.mdx$/, ""));
});

export async function writeGeneratedIndex(items: MediaItem[]) {
  await fs.mkdir(path.dirname(generatedIndexPath), { recursive: true });
  await fs.writeFile(generatedIndexPath, JSON.stringify(items, null, 2));
}
