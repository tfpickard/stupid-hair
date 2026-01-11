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
          <li>• v2: Automated Sora sync when a public API exists.</li>
        </ul>
        <p className="text-white/60">
          Until an official Sora API exists, the feed is powered by local MDX
          files and a placeholder sync script. When the API appears, the sync
          script is where automation will plug in.
        </p>
      </div>
    </div>
  );
}
