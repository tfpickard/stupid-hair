import { FeedPage } from "@/components/feed/FeedPage";

export const revalidate = 60;

export default function PhotosPage() {
  return (
    <FeedPage
      title="Photos"
      description="Still frames, cursed and curated."
      initialType="image"
    />
  );
}
