import { createInterface } from "readline/promises";
import { promises as fs } from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "content", "media");

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const title = (await rl.question("Title: ")).trim();
  const slugInput = (await rl.question("Slug (optional): ")).trim();
  const type = (await rl.question(
    "Type (video/image/game/other) [video]: "
  )).trim();
  const description = (await rl.question("Description (optional): ")).trim();
  const tagsInput = (await rl.question("Tags (comma-separated): ")).trim();

  rl.close();

  if (!title) {
    throw new Error("Title is required");
  }

  const slug = slugInput || slugify(title);
  if (!slug) {
    throw new Error("Unable to generate slug");
  }

  const createdAt = new Date().toISOString().split("T")[0];
  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const frontmatter = `---\ntitle: "${title}"\ncreatedAt: "${createdAt}"\ntype: "${type || "video"}"\nsource: "sora"\nassets:\n  poster: "/media/stupid-hair-poster.svg"\ntags:${tags.length ? "\n" + tags.map((tag) => `  - ${tag}`).join("\n") : " []"}\n${description ? `description: "${description}"\n` : ""}visibility: "public"\n---\n\nWrite your notes here.\n`;

  await fs.mkdir(contentDir, { recursive: true });
  const filePath = path.join(contentDir, `${slug}.mdx`);

  try {
    await fs.access(filePath);
    throw new Error(`File already exists: ${filePath}`);
  } catch {
    await fs.writeFile(filePath, frontmatter, "utf8");
  }

  console.log(`Created ${filePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
