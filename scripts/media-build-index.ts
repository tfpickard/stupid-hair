import { getMediaIndex, writeGeneratedIndex } from "../lib/media/registry";

async function main() {
  const items = await getMediaIndex();
  await writeGeneratedIndex(items);
  console.log(`Wrote .generated/media-index.json with ${items.length} items.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
