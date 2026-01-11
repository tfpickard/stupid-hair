import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const syncEndpoint = process.env.SORA_SYNC_ENDPOINT;
const token = process.env.SORA_SYNC_TOKEN;
const localDir =
  process.env.SORA_SYNC_LOCAL_DIR ??
  path.join(process.cwd(), "public", "media", "sora");
const defaultUsername = process.env.SORA_USERNAME ?? "goatspeed";
const AUTO_SYNC_MARKER = "<!-- auto-synced -->";
const supportedExtensions = new Set([".mp4", ".mov", ".webm"]);

type RemoteEntry = {
  slug: string;
  body: string;
};

type LocalMetadata = {
  title?: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
  prompt?: string;
  model?: string;
  soraId?: string;
  username?: string;
  poster?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  visibility?: "public" | "unlisted";
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}

function titleize(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date) {
  return value.toISOString().split("T")[0];
}

async function readJsonIfExists(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as LocalMetadata;
  } catch {
    return null;
  }
}

function buildBody(metadata: LocalMetadata | null) {
  const blocks: string[] = [AUTO_SYNC_MARKER];
  if (metadata?.prompt) {
    blocks.push("", `<PromptBlock prompt="${metadata.prompt}" />`);
  }
  if (metadata?.tags && metadata.tags.length > 0) {
    const tags = metadata.tags.map((tag) => `"${tag}"`).join(", ");
    blocks.push("", `<TagList tags={[${tags}]} />`);
  }
  return blocks.join("\n");
}

async function writeMdxFile(
  filePath: string,
  frontmatter: Record<string, unknown>,
  body: string
) {
  const content = matter.stringify(body, frontmatter);
  await fs.writeFile(filePath, content, "utf8");
}

async function syncFromEndpoint() {
  if (!syncEndpoint || !token) {
    return false;
  }

  const response = await fetch(syncEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const payload = (await response.json()) as RemoteEntry[];
  const contentDir = path.join(process.cwd(), "content", "media");
  await fs.mkdir(contentDir, { recursive: true });

  for (const entry of payload) {
    const filePath = path.join(contentDir, `${entry.slug}.mdx`);
    await fs.writeFile(filePath, entry.body, "utf8");
  }

  console.log(`Synced ${payload.length} items from Sora.`);
  return true;
}

async function syncFromLocal() {
  const contentDir = path.join(process.cwd(), "content", "media");
  await fs.mkdir(contentDir, { recursive: true });

  let entries: string[] = [];
  try {
    entries = await fs.readdir(localDir);
  } catch {
    console.log(
      `Local Sora sync skipped. No directory found at ${path.relative(
        process.cwd(),
        localDir
      )}.`
    );
    return;
  }

  const videoFiles = entries.filter((entry) =>
    supportedExtensions.has(path.extname(entry).toLowerCase())
  );

  if (videoFiles.length === 0) {
    console.log(
      `Local Sora sync skipped. No video files found in ${path.relative(
        process.cwd(),
        localDir
      )}.`
    );
    return;
  }

  let synced = 0;

  for (const file of videoFiles) {
    const filePath = path.join(localDir, file);
    const stats = await fs.stat(filePath);
    const basename = path.basename(file, path.extname(file));
    const slug = slugify(basename);
    const metadata = await readJsonIfExists(
      path.join(localDir, `${basename}.json`)
    );
    const createdAt = metadata?.createdAt
      ? metadata.createdAt
      : formatDate(stats.mtime);
    const title = metadata?.title ?? titleize(basename);
    const tags = metadata?.tags ?? ["sora"];
    const prompt = metadata?.prompt;
    const username = metadata?.username ?? defaultUsername;
    const frontmatter = {
      title,
      createdAt,
      type: "video",
      source: "sora",
      sora: {
        username,
        soraId: metadata?.soraId,
        prompt,
        model: metadata?.model,
      },
      assets: {
        src: `/media/sora/${file}`,
        poster: metadata?.poster,
        width: metadata?.width,
        height: metadata?.height,
        durationSec: metadata?.durationSec,
      },
      tags,
      description: metadata?.description,
      visibility: metadata?.visibility ?? "public",
    };

    const mdxPath = path.join(contentDir, `${slug}.mdx`);
    let shouldWrite = true;
    let body = buildBody(metadata);

    try {
      const raw = await fs.readFile(mdxPath, "utf8");
      const parsed = matter(raw);
      const existingBody = parsed.content.trim();
      if (!existingBody.includes(AUTO_SYNC_MARKER)) {
        shouldWrite = false;
      } else {
        body = buildBody(metadata);
      }
    } catch {
      shouldWrite = true;
    }

    if (!shouldWrite) {
      continue;
    }

    await writeMdxFile(mdxPath, frontmatter, body);
    synced += 1;
  }

  console.log(`Synced ${synced} local Sora items.`);
}

async function main() {
  const didSync = await syncFromEndpoint();
  if (didSync) {
    return;
  }

  await syncFromLocal();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
