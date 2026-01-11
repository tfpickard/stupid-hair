import { siteConfig } from "@/lib/site";

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">
          Roadmap
        </p>
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          About {siteConfig.name}
        </h1>
        <p className="text-base text-white/70">
          Minimal, fast, expandable. The feed is real. The rest is in the oven.
        </p>
      </header>

      <div className="space-y-6 text-sm text-white/80">
        <p>
          This site is a catalog of Sora experiments by {siteConfig.handle}. The
          goal is to keep a living feed of the newest creations with enough
          metadata to be searchable, linkable, and weirdly convincing.
        </p>
        <ul className="space-y-3">
          <li>• v1: Infinite Sora feed, MDX notes, and RSS.</li>
          <li>• v1.5: Photos, other media, and micro-games.</li>
          <li>• v2: Automated Sora sync from the official API.</li>
        </ul>
        <p className="text-white/60">
          Sora sync now runs automatically during dev and build. Drop videos in
          <span className="font-semibold text-white"> /public/media/sora</span>{" "}
          (with optional JSON sidecars) or configure SORA_SYNC_ENDPOINT +
          SORA_SYNC_TOKEN to pull from an API.
        </p>
      </div>
    </div>
  );
}
