import { z } from "zod";
import type { MediaItem, MediaType } from "./types";

const tagsSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return value;
  },
  z.array(z.string()).default([])
);

const sourcesSchema = z
  .array(
    z.object({
      src: z.string(),
      type: z.string(),
    })
  )
  .optional();

export const mediaFrontmatterSchema = z.object({
  title: z.string().min(1),
  createdAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "createdAt must be a valid date",
  }),
  type: z.enum(["video", "image", "game", "other"]),
  source: z.enum(["sora", "upload", "external"]).default("sora"),
  sora: z
    .object({
      username: z.string().default("goatspeed"),
      soraId: z.string().optional(),
      prompt: z.string().optional(),
      model: z.string().optional(),
    })
    .optional(),
  assets: z
    .object({
      poster: z.string().optional(),
      src: z.string().optional(),
      sources: sourcesSchema,
      width: z.number().optional(),
      height: z.number().optional(),
      durationSec: z.number().optional(),
    })
    .default({}),
  tags: tagsSchema,
  description: z.string().optional(),
  visibility: z.enum(["public", "unlisted"]).default("public"),
});

export type MediaFrontmatter = z.infer<typeof mediaFrontmatterSchema>;

export function toMediaItem(
  slug: string,
  frontmatter: MediaFrontmatter
): MediaItem {
  const sora = frontmatter.sora
    ? {
        username: frontmatter.sora.username || "goatspeed",
        soraId: frontmatter.sora.soraId,
        prompt: frontmatter.sora.prompt,
        model: frontmatter.sora.model,
      }
    : undefined;

  return {
    id: slug,
    slug,
    title: frontmatter.title,
    createdAt: new Date(frontmatter.createdAt).toISOString(),
    type: frontmatter.type as MediaType,
    source: frontmatter.source,
    sora,
    assets: frontmatter.assets ?? {},
    tags: frontmatter.tags ?? [],
    description: frontmatter.description,
    visibility: frontmatter.visibility,
  };
}
