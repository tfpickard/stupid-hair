export type MediaType = "video" | "image" | "game" | "other";
export type MediaSource = "sora" | "upload" | "external";

export type MediaVisibility = "public" | "unlisted";

export interface MediaAssetSource {
  src: string;
  type: string;
}

export interface MediaAssets {
  poster?: string;
  src?: string;
  sources?: MediaAssetSource[];
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface SoraMeta {
  username: string;
  soraId?: string;
  prompt?: string;
  model?: string;
}

export interface MediaItem {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  type: MediaType;
  source: MediaSource;
  sora?: SoraMeta;
  assets: MediaAssets;
  tags: string[];
  description?: string;
  visibility?: MediaVisibility;
}

export interface MediaEntry {
  item: MediaItem;
  content: string;
}
