import { promises as fs } from "fs";
import path from "path";

const syncEndpoint = process.env.SORA_SYNC_ENDPOINT;
const token = process.env.SORA_SYNC_TOKEN;

async function main() {
  if (!syncEndpoint || !token) {
    console.log(
      "Sora sync is not configured. Set SORA_SYNC_ENDPOINT and SORA_SYNC_TOKEN in .env.local when an official API is available."
    );
    return;
  }

  const response = await fetch(syncEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    slug: string;
    body: string;
  }>;

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
