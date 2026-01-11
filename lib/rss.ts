import { siteConfig } from "./site";
import type { MediaItem } from "./media/types";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mediaEnclosure(item: MediaItem) {
  if (item.type !== "video") return "";
  const src = item.assets.src || item.assets.sources?.[0]?.src;
  if (!src) return "";
  return `\n      <enclosure url="${escapeXml(src)}" type="video/mp4" />`;
}

export function buildRss(items: MediaItem[]) {
  const feedItems = items
    .filter((item) => item.visibility !== "unlisted")
    .map((item) => {
      const link = `${siteConfig.url}/m/${item.slug}`;
      const description = escapeXml(item.description ?? "");
      const title = escapeXml(item.title);
      const pubDate = new Date(item.createdAt).toUTCString();
      return `\n    <item>\n      <title>${title}</title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${description}</description>${mediaEnclosure(
        item
      )}\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(siteConfig.name)} feed</title>\n    <link>${siteConfig.url}</link>\n    <description>${escapeXml(siteConfig.description)}</description>\n    <language>en-us</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${feedItems}\n  </channel>\n</rss>`;
}
