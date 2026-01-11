# stupid.hair

Minimal creator portfolio for **@goatspeed**. Built with Next.js App Router, Bun, and Tailwind CSS. The feed is MDX-first, doom-scrollable, and ready for future Sora automation.

## Quickstart

```bash
bun install
bun dev
```

Build for production:

```bash
bun run build
bun start
```

## Content workflow (MDX-first)

Media items live in `content/media/*.mdx`. Frontmatter is the canonical registry for the feed, detail pages, and RSS.

### Add a new item

```bash
bun run media:add
```

This creates a new MDX file with a stub frontmatter.

### Validate frontmatter + assets

```bash
bun run media:validate
```

This checks schema validity and verifies that local assets referenced in frontmatter exist in `public/`.

### Build a JSON index (optional cache)

```bash
bun run media:build-index
```

Writes `/.generated/media-index.json` for faster cold starts.

## Frontmatter schema

```yaml
---
title: "Orchard with Teeth"
createdAt: "2024-08-10"
type: "video" # video | image | game | other
source: "sora" # sora | upload | external
sora:
  username: "goatspeed"
  soraId: "optional"
  prompt: "optional"
  model: "optional"
assets:
  poster: "/media/example.svg"
  src: "/media/example.mp4"
  sources:
    - src: "https://.../example.mp4"
      type: "video/mp4"
  width: 1200
  height: 720
  durationSec: 12

tags:
  - surreal
  - body horror

description: "Short summary"
visibility: "public" # public | unlisted
---
```

## MDX components

Use these inside `content/media/*.mdx`:

- `<Callout title="..."></Callout>`
- `<PromptBlock prompt="..."></PromptBlock>`
- `<TagList tags={["tag"]} />`
- `<MediaEmbed type="image" src="..." />`

## Media assets

Place local assets in `public/media/`. Reference them in frontmatter with `/media/...` paths.

## RSS

`/rss.xml` is generated from the same MDX index used by the feed.

## Sora sync

The media feed can be synced automatically from a JSON export or API response:

```bash
bun run media:sync
```

Provide one of the following:

- `SORA_SYNC_ENDPOINT` (optionally with `SORA_SYNC_TOKEN`) for a JSON API.
- `SORA_SYNC_FEED_PATH` for a local JSON file (defaults to `content/sora-feed.json` if present).

The sync script transforms the JSON payload into MDX entries, replacing the placeholder content with your latest Sora videos.

## Deployment

- Vercel-friendly with App Router defaults.
- Add any secrets to `.env.local` (never commit them).
- Optional: run `bun run media:build-index` in CI for faster cold starts.

## Project structure

```
/app
  /(home feed)
  /m/[slug]
  /videos
  /photos
  /games
  /games/[slug]
  /rss.xml
  /api/feed
/components
/content/media
/lib
/public/media
```
