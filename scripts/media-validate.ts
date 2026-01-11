import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import { mediaFrontmatterSchema } from "../lib/media/schema";

const contentDir = path.join(process.cwd(), "content", "media");
const publicDir = path.join(process.cwd(), "public");

async function listMdxFiles() {
  const entries = await fs.readdir(contentDir);
  return entries.filter((entry) => entry.endsWith(".mdx"));
}

async function validateAsset(assetPath: string) {
  if (!assetPath.startsWith("/")) return;
  const resolved = path.join(publicDir, assetPath);
  await fs.access(resolved);
}

async function main() {
  const files = await listMdxFiles();
  const errors: string[] = [];

  for (const file of files) {
    const fullPath = path.join(contentDir, file);
    const raw = await fs.readFile(fullPath, "utf8");
    const { data } = matter(raw);

    const parsed = mediaFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      errors.push(`${file}: ${parsed.error.message}`);
      continue;
    }

    const { assets } = parsed.data;
    const assetPaths = [assets.poster, assets.src]
      .filter(Boolean)
      .map((value) => value as string);
    const sources = assets.sources?.map((source) => source.src) ?? [];

    for (const assetPath of [...assetPaths, ...sources]) {
      if (!assetPath.startsWith("/")) continue;
      try {
        await validateAsset(assetPath);
      } catch {
        errors.push(`${file}: missing asset ${assetPath}`);
      }
    }
  }

  if (errors.length) {
    console.error("Media validation failed:\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log(`Validated ${files.length} media items.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
