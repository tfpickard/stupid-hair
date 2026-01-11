import Link from "next/link";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Feed" },
  { href: "/videos", label: "Videos" },
  { href: "/photos", label: "Photos" },
  { href: "/games", label: "Games" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Link href="/" className="text-xl font-semibold text-white">
            {siteConfig.name}
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-lime-200">
            {siteConfig.handle}
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-white/60">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-lime-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/rss.xml"
            className="transition hover:text-lime-200"
          >
            RSS
          </Link>
        </nav>
      </div>
    </header>
  );
}
