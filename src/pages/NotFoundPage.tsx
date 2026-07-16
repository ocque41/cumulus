import { HeroDither } from "@/components/visual/HeroDither";
import { AppLink, useDocumentMeta } from "@/lib/router";

export function NotFoundPage() {
  useDocumentMeta("Log not found — Cumulus lab");

  return (
    <section className="not-found page-shell">
      <div>
        <p className="eyebrow">404 / signal absent</p>
        <h1>This log is not in the field.</h1>
        <p>The address may have moved, or the entry may not be public.</p>
        <AppLink className="button-primary" href="/logs">
          Open the log index
        </AppLink>
      </div>
      <HeroDither
        fallbackClassName="not-found__fallback"
        frame={404}
        maxPixelCount={460_000}
        shape="simplex"
        size={4}
        speed={0.1}
        type="8x8"
      />
    </section>
  );
}
