import { promises as fs } from "fs";
import path from "path";

const syncEndpoint = process.env.SORA_SYNC_ENDPOINT;
const token = process.env.SORA_SYNC_TOKEN;
const feedPath = process.env.SORA_SYNC_FEED_PATH;
const defaultUsername = process.env.SORA_SYNC_USERNAME ?? "goatspeed";
const defaultFeedPath = path.join(process.cwd(), "content", "sora-feed.json");

type SyncPayload = {
  items?: SyncItem[];
};

type SyncItem = {
  id?: string;
  slug?: string;
  title?: string;
  createdAt?: string;
  type?: "video" | "image" | "other";
  description?: string;
  tags?: string[];
  visibility?: "public" | "unlisted";
  prompt?: string;
  model?: string;
  username?: string;
  soraId?: string;
  assets?: {
    poster?: string;
    src?: string;
    sources?: Array<{ src: string; type?: string }>;
    width?: number;
    height?: number;
    durationSec?: number;
  };
  videoUrl?: string;
  videoType?: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
};

type NormalizedItem = {
  slug: string;
  title: string;
  createdAt: string;
  type: "video" | "image" | "other";
  description?: string;
  tags: string[];
  visibility: "public" | "unlisted";
  sora: {
    username: string;
    soraId?: string;
    prompt?: string;
    model?: string;
  };
  assets: {
    poster?: string;
    src?: string;
    sources?: Array<{ src: string; type: string }>;
    width?: number;
    height?: number;
    durationSec?: number;
  };
};

const contentDir = path.join(process.cwd(), "content", "media");

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}

function escapeYamlString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, " ");
}

function formatYamlString(value: string) {
  return `"${escapeYamlString(value)}"`;
}

function normalizeItem(item: SyncItem): NormalizedItem {
  const title = item.title ?? item.slug ?? item.id ?? "Untitled Sora Clip";
  const slug = item.slug ?? slugify(title) ?? item.id ?? "sora-clip";
  const createdAt = item.createdAt ?? new Date().toISOString().split("T")[0];
  const type = item.type ?? "video";
  const tags = item.tags ?? [];
  const visibility = item.visibility ?? "public";

  const sources =
    item.assets?.sources ??
    (item.videoUrl
      ? [
          {
            src: item.videoUrl,
            type: item.videoType ?? "video/mp4",
          },
        ]
      : undefined);

  const assets = {
    poster: item.assets?.poster ?? item.posterUrl,
    src: item.assets?.src,
    sources,
    width: item.assets?.width ?? item.width,
    height: item.assets?.height ?? item.height,
    durationSec: item.assets?.durationSec ?? item.durationSec,
  };

  return {
    slug,
    title,
    createdAt,
    type,
    description: item.description,
    tags,
    visibility,
    sora: {
      username: item.username ?? defaultUsername,
      soraId: item.soraId ?? item.id,
      prompt: item.prompt,
      model: item.model,
    },
    assets,
  };
}

function buildFrontmatter(item: NormalizedItem) {
  const lines = [
    "---",
    `title: ${formatYamlString(item.title)}`,
    `createdAt: ${formatYamlString(item.createdAt)}`,
    `type: ${formatYamlString(item.type)}`,
    `source: "sora"`,
  ];

  if (item.sora) {
    lines.push("sora:");
    lines.push(`  username: ${formatYamlString(item.sora.username)}`);
    if (item.sora.soraId) {
      lines.push(`  soraId: ${formatYamlString(item.sora.soraId)}`);
    }
    if (item.sora.prompt) {
      lines.push(`  prompt: ${formatYamlString(item.sora.prompt)}`);
    }
    if (item.sora.model) {
      lines.push(`  model: ${formatYamlString(item.sora.model)}`);
    }
  }

  lines.push("assets:");
  if (item.assets.poster) {
    lines.push(`  poster: ${formatYamlString(item.assets.poster)}`);
  }
  if (item.assets.src) {
    lines.push(`  src: ${formatYamlString(item.assets.src)}`);
  }
  if (item.assets.sources && item.assets.sources.length > 0) {
    lines.push("  sources:");
    item.assets.sources.forEach((source) => {
      lines.push(`    - src: ${formatYamlString(source.src)}`);
      lines.push(`      type: ${formatYamlString(source.type)}`);
    });
  }
  if (item.assets.width) {
    lines.push(`  width: ${item.assets.width}`);
  }
  if (item.assets.height) {
    lines.push(`  height: ${item.assets.height}`);
  }
  if (item.assets.durationSec) {
    lines.push(`  durationSec: ${item.assets.durationSec}`);
  }

  if (item.tags.length > 0) {
    lines.push("tags:");
    item.tags.forEach((tag) => {
      lines.push(`  - ${formatYamlString(tag)}`);
    });
  } else {
    lines.push("tags: []");
  }

  if (item.description) {
    lines.push(`description: ${formatYamlString(item.description)}`);
  }

  lines.push(`visibility: ${formatYamlString(item.visibility)}`);
  lines.push("---");
  return lines.join("\n");
}

function buildBody(item: NormalizedItem) {
  const lines: string[] = [];
  const embedProps: string[] = [];
  embedProps.push(`type="${item.type}"`);

  if (item.assets.poster) {
    embedProps.push(`poster="${escapeYamlString(item.assets.poster)}"`);
  }
  if (item.assets.src) {
    embedProps.push(`src="${escapeYamlString(item.assets.src)}"`);
  }
  if (item.assets.sources && item.assets.sources.length > 0) {
    embedProps.push(`sources={${JSON.stringify(item.assets.sources)}}`);
  }
  if (item.assets.width) {
    embedProps.push(`width={${item.assets.width}}`);
  }
  if (item.assets.height) {
    embedProps.push(`height={${item.assets.height}}`);
  }

  if (embedProps.length > 0) {
    lines.push(`<MediaEmbed ${embedProps.join(" ")} />`);
  }

  if (item.sora.prompt) {
    lines.push(
      `<PromptBlock prompt={${JSON.stringify(item.sora.prompt)}} />`
    );
  }

  if (item.tags.length > 0) {
    lines.push(`<TagList tags={${JSON.stringify(item.tags)}} />`);
  }

  return lines.join("\n\n");
}

async function loadPayload(): Promise<SyncItem[]> {
  if (syncEndpoint) {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(syncEndpoint, { headers });
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
    const payload = (await response.json()) as SyncItem[] | SyncPayload;
    return Array.isArray(payload) ? payload : payload.items ?? [];
  }

  const resolvedFeedPath = feedPath ?? defaultFeedPath;
  try {
    await fs.access(resolvedFeedPath);
    const raw = await fs.readFile(resolvedFeedPath, "utf8");
    const payload = JSON.parse(raw) as SyncItem[] | SyncPayload;
    return Array.isArray(payload) ? payload : payload.items ?? [];
  } catch {
    return [];
  }

  return [];
}

async function main() {
  const payload = await loadPayload();
  if (payload.length === 0) {
    console.log(
      "Sora sync skipped. Set SORA_SYNC_ENDPOINT or SORA_SYNC_FEED_PATH (or add content/sora-feed.json) with Sora items."
    );
    return;
  }

  await fs.mkdir(contentDir, { recursive: true });

  const normalized = payload.map(normalizeItem);
  for (const item of normalized) {
    const frontmatter = buildFrontmatter(item);
    const body = buildBody(item);
    const filePath = path.join(contentDir, `${item.slug}.mdx`);
    const content = `${frontmatter}\n\n${body}\n`;
    await fs.writeFile(filePath, content, "utf8");
  }

  console.log(`Synced ${normalized.length} items from Sora.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
