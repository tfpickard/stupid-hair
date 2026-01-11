import { FeedPage } from "@/components/feed/FeedPage";

export const revalidate = 60;

export default function VideosPage() {
  return (
    <FeedPage
      title="Videos"
      description="Sora clips, looped and annotated."
      initialType="video"
    />
  );
}
