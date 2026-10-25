import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AUTH_PAGE_PROMPTS } from "@/data/navigation";
import { SessionSummary } from "@/components/auth/session-summary";

export const metadata: Metadata = {
  title: "Session",
};

export default function Session() {
  const prompts = AUTH_PAGE_PROMPTS.signup;

  return (
    <>
      <SiteHeader
        prompt={prompts.headerPrompt}
        ctaLabel={prompts.headerCta.label}
        ctaHref={prompts.headerCta.href}
      />
      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-12 items-center gap-8 px-6 py-8 sm:px-10 lg:px-16">
        <div className="col-span-12 flex justify-center lg:col-span-5 lg:col-start-8">
          <SessionSummary />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
