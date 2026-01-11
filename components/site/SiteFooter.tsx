import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-xs uppercase tracking-[0.2em] text-white/40 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} stupid.hair</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-lime-200">
            Roadmap
          </Link>
          <Link href="/rss.xml" className="hover:text-lime-200">
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}
