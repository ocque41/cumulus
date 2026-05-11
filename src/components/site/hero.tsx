import Link from "next/link";

import { Button } from "@/components/ui/button";
// brand-alignment: voxel scene retired per CUMULUS-BRAND.md; restore by uncommenting if needed
// import { VoxelBackground } from "@/components/site/voxel-background";
import { AnimatedHero } from "@/components/animation";

export function Hero() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(now);

  return (
    <section className="container relative isolate flex h-[calc(100vh-6rem)] -mt-12 flex-col items-center justify-center overflow-hidden text-center">
      {/* brand-alignment: voxel scene retired per CUMULUS-BRAND.md; restore by uncommenting if needed */}
      {/* <VoxelBackground className="absolute inset-x-[-12vw] inset-y-[-14vh] opacity-40" /> */}
      <AnimatedHero className="flex flex-col items-center text-center">
        <div
          data-hero-eyebrow
          className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[color:var(--muted)]"
          style={{ opacity: 0 }}
        >
          <time dateTime={now.toISOString()} className="tracking-widest uppercase text-xs font-medium opacity-80">{formatted}</time>
          <span aria-hidden className="opacity-40">•</span>
          <span className="uppercase tracking-[0.3em] text-xs font-semibold text-[color:var(--title)]">
            Product Customization
          </span>
        </div>

        <h1
          data-hero-title
          className="display max-w-5xl mb-8 text-center"
          style={{ opacity: 0 }}
        >
          AI for Ecommerce Boutiques
        </h1>

        <div
          data-hero-description
          className="max-w-3xl space-y-6 lead mb-12 text-center"
          style={{ opacity: 0 }}
        >
          <p>The ecosystem for AI Automation</p>
        </div>

        <div
          data-hero-cta
          className="flex flex-wrap justify-center gap-4"
          style={{ opacity: 0 }}
        >
          <Button
            asChild
            size="lg"
            variant="brand"
            className="text-base px-8 h-12 text-[#141414]"
          >
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </AnimatedHero>
    </section>
  );
}

