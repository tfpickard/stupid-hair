import { promises as fs } from "fs";
import path from "path";

const syncEndpoint = process.env.SORA_SYNC_ENDPOINT;
const token = process.env.SORA_SYNC_TOKEN;
const profileUrl = process.env.SORA_PROFILE_URL;
const profileCookie = process.env.SORA_PROFILE_COOKIE;

type SyncPayloadItem = {
  slug: string;
  body: string;
};

type ScrapedMedia = {
  id?: string;
  title?: string;
  prompt?: string;
  description?: string;
  createdAt?: string;
  mediaUrl?: string;
  posterUrl?: string;
  type?: "video" | "image";
  model?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  mimeType?: string;
  username?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}

function yamlString(value?: string) {
  if (!value) return "";
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

function guessMimeType(url?: string, fallback = "video/mp4") {
  if (!url) return fallback;
  const lower = url.toLowerCase();
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  return fallback;
}

function resolveUsername(url?: string, override?: string) {
  if (override) return override;
  if (!url) return "goatspeed";
  const trimmed = url.replace(/\/+$/, "");
  const parts = trimmed.split("/");
  const handle = parts[parts.length - 1];
  return handle || "goatspeed";
}

function parseDate(value?: string) {
  if (!value) return new Date().toISOString().split("T")[0];
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

async function fetchFromEndpoint(): Promise<SyncPayloadItem[]> {
  if (!syncEndpoint || !token) {
    return [];
  }

  const response = await fetch(syncEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return (await response.json()) as SyncPayloadItem[];
}

async function fetchProfileHtml(url: string) {
  const headers: Record<string, string> = {
    "User-Agent": "stupid-hair-media-sync/1.0",
    Accept: "text/html,application/xhtml+xml",
  };
  if (profileCookie) {
    headers.Cookie = profileCookie;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const hint =
      response.status === 403
        ? " (Cloudflare blocked the request; set SORA_PROFILE_COOKIE from a logged-in session.)"
        : "";
    throw new Error(`Profile fetch failed: ${response.status}${hint}`);
  }
  return response.text();
}

function extractNextData(html: string) {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>(?<json>[\s\S]*?)<\/script>/
  );
  if (!match?.groups?.json) return null;
  try {
    return JSON.parse(match.groups.json) as unknown;
  } catch {
    return null;
  }
}

function normalizeCandidate(candidate: Record<string, unknown>): ScrapedMedia | null {
  const mediaUrl =
    (candidate.videoUrl as string) ||
    (candidate.video_url as string) ||
    (candidate.imageUrl as string) ||
    (candidate.image_url as string) ||
    (candidate.mediaUrl as string) ||
    (candidate.media_url as string) ||
    (candidate.assetUrl as string) ||
    (candidate.url as string) ||
    (candidate.src as string);

  if (!mediaUrl) return null;

  const typeValue =
    (candidate.type as string) ||
    (candidate.mediaType as string) ||
    (candidate.assetType as string) ||
    "";
  const lowerType = typeValue.toLowerCase();
  const inferredType =
    lowerType.includes("image") || guessMimeType(mediaUrl).startsWith("image")
      ? "image"
      : "video";

  const title =
    (candidate.title as string) ||
    (candidate.name as string) ||
    (candidate.caption as string) ||
    (candidate.prompt as string);

  return {
    id:
      (candidate.id as string) ||
      (candidate.uuid as string) ||
      (candidate.creationId as string),
    title,
    prompt: (candidate.prompt as string) || (candidate.text as string),
    description: (candidate.description as string),
    createdAt:
      (candidate.createdAt as string) ||
      (candidate.created_at as string) ||
      (candidate.created as string),
    mediaUrl,
    posterUrl:
      (candidate.thumbnailUrl as string) ||
      (candidate.previewUrl as string) ||
      (candidate.posterUrl as string) ||
      (candidate.poster_url as string),
    type: inferredType,
    model:
      (candidate.model as string) ||
      (candidate.modelId as string) ||
      (candidate.model_id as string),
    width: Number.isFinite(candidate.width) ? Number(candidate.width) : undefined,
    height: Number.isFinite(candidate.height)
      ? Number(candidate.height)
      : undefined,
    durationSec: Number.isFinite(candidate.durationSec)
      ? Number(candidate.durationSec)
      : undefined,
    mimeType: (candidate.mimeType as string) || (candidate.mime_type as string),
    username: (candidate.username as string),
  };
}

function collectCandidates(root: unknown) {
  const results: ScrapedMedia[] = [];
  const seen = new Set<string>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;
    const candidate = normalizeCandidate(record);
    if (candidate) {
      const key = candidate.id || candidate.mediaUrl || candidate.title;
      if (key && !seen.has(key)) {
        results.push(candidate);
        seen.add(key);
      }
    }

    Object.values(record).forEach(visit);
  };

  visit(root);
  return results;
}

function buildMdx(entry: ScrapedMedia, username: string): string {
  const createdAt = parseDate(entry.createdAt);
  const title = entry.title || entry.prompt || "Sora Creation";
  const prompt = entry.prompt || entry.description;
  const description = entry.description || entry.prompt;
  const model = entry.model || "sora-v1";
  const mediaType = entry.type || "video";
  const poster = entry.posterUrl || "/media/stupid-hair-poster.svg";
  const tags = ["sora"];

  const lines = [
    "---",
    `title: "${yamlString(title)}"`,
    `createdAt: "${createdAt}"`,
    `type: "${mediaType}"`,
    `source: "sora"`,
    "sora:",
    `  username: "${yamlString(username)}"`,
    entry.id ? `  soraId: "${yamlString(entry.id)}"` : null,
    prompt ? `  prompt: "${yamlString(prompt)}"` : null,
    model ? `  model: "${yamlString(model)}"` : null,
    "assets:",
  ];

  if (mediaType === "image") {
    lines.push(`  src: "${yamlString(entry.mediaUrl)}"`);
    if (entry.width) lines.push(`  width: ${entry.width}`);
    if (entry.height) lines.push(`  height: ${entry.height}`);
  } else {
    lines.push(`  poster: "${yamlString(poster)}"`);
    lines.push("  sources:");
    lines.push(`    - src: "${yamlString(entry.mediaUrl)}"`);
    lines.push(
      `      type: "${yamlString(entry.mimeType || guessMimeType(entry.mediaUrl))}"`
    );
    if (entry.durationSec) {
      lines.push(`  durationSec: ${entry.durationSec}`);
    }
  }

  lines.push("tags:");
  tags.forEach((tag) => {
    lines.push(`  - ${tag}`);
  });
  if (description) {
    lines.push(`description: "${yamlString(description)}"`);
  }
  lines.push('visibility: "public"');
  lines.push("---");
  lines.push("");
  lines.push("Synced from the Sora profile feed.");

  return lines.filter(Boolean).join("\n");
}

async function scrapeProfile(url: string): Promise<SyncPayloadItem[]> {
  const html = await fetchProfileHtml(url);
  const nextData = extractNextData(html);
  if (!nextData) {
    throw new Error("Unable to locate __NEXT_DATA__ in the profile page.");
  }

  const candidates = collectCandidates(nextData);
  if (!candidates.length) {
    throw new Error("No media items found in the profile data.");
  }

  const username = resolveUsername(url);
  const slugCounts = new Map<string, number>();

  return candidates.map((entry) => {
    const base =
      entry.id?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      slugify(entry.title || entry.prompt || "sora-creation");
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    const slug = count ? `${base}-${count + 1}` : base;
    return {
      slug,
      body: buildMdx(
        {
          ...entry,
          username: entry.username || username,
        },
        entry.username || username
      ),
    };
  });
}

async function main() {
  let payload: SyncPayloadItem[] = [];

  if (syncEndpoint && token) {
    payload = await fetchFromEndpoint();
  } else if (profileUrl) {
    payload = await scrapeProfile(profileUrl);
  } else {
    console.log(
      "Sora sync is not configured. Set SORA_SYNC_ENDPOINT + SORA_SYNC_TOKEN, or SORA_PROFILE_URL (and SORA_PROFILE_COOKIE if required)."
    );
    return;
  }

  const contentDir = path.join(process.cwd(), "content", "media");
  await fs.mkdir(contentDir, { recursive: true });

  for (const entry of payload) {
    const filePath = path.join(contentDir, `${entry.slug}.mdx`);
    await fs.writeFile(filePath, entry.body, "utf8");
  }

  console.log(`Synced ${payload.length} items from Sora.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
