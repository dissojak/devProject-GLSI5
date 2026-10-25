import Link from "next/link";
import { BRAND } from "@/data/brand";
import { NAV_LINKS } from "@/data/navigation";
import { buttonClass } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";

interface SiteHeaderProps {
  prompt: string;
  ctaLabel: string;
  ctaHref: string;
}

export function SiteHeader({ prompt, ctaLabel, ctaHref }: SiteHeaderProps) {
  return (
    <header className="relative z-20 flex h-[72px] w-full shrink-0 items-center justify-between border-b border-ice/15 px-6 sm:px-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ice shadow-md shadow-ice/20">
          <MaterialIcon name="rocket_launch" fill className="text-[20px] text-navy" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foam">{BRAND.name}</span>
      </div>
      <nav className="hidden items-center space-x-8 text-sm font-medium md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.id} className="text-mist transition-colors hover:text-foam" href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-mist">{prompt}</span>
        <Link className={buttonClass("champagne", "px-4 py-2 text-sm")} href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
