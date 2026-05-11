"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { submitContactAction } from "@/app/actions/contact";
import { ScrollReveal } from "@/components/animation";
import { ViewTunnelIn } from "@/components/core";
import { HyperInput, HyperTextarea, LaunchButton } from "@/components/effects/hyper-input";
import { Section } from "@/components/site/section";
import { ParticleTunnel } from "@/components/three";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useReducedMotion } from "@/hooks";
import { cn } from "@/lib/utils";
import { normalizeMarketLocale, t } from "@/lib/marketing/i18n";
import { PHRASES } from "@/lib/marketing/phrases";
import { PRODUCT_META, PRODUCT_ORDER } from "@/lib/marketing/products";
import type { ProductId } from "@/lib/marketing/products/types";
import { MARKET_LOCALE_COOKIE } from "@/lib/marketing/runtime";
import type { MarketLocale } from "@/lib/marketing/schema";
import { toast } from "sonner";

const PAGE_COPY: Record<MarketLocale, { eyebrow: string; title: string; body: string; pitch: string[] }> = {
  en: {
    eyebrow: "Enterprise",
    title: "Something tailored to your team.",
    body: "Cumulus ships independent projects. Enterprise engagements wrap around any of them — customization, exclusivity, or a tailored product assembled from the catalog.",
    pitch: [
      "Customize Tado or Relay to fit your infrastructure, workflow, or brand.",
      "Exclusivity arrangements — non-compete scope, private forks, internal-only deployments.",
      "Tailored assemblies — pick pieces across the catalog and we build the glue.",
      "Extended support, dedicated channels, and priority sequencing on what ships next.",
    ],
  },
  es: {
    eyebrow: "Enterprise",
    title: "Algo a medida para tu equipo.",
    body: "Cumulus publica proyectos independientes. Los compromisos enterprise se envuelven alrededor de cualquiera de ellos — personalizacion, exclusividad, o un producto hecho a medida a partir del catalogo.",
    pitch: [
      "Personaliza Tado o Relay a tu infraestructura, flujo de trabajo o marca.",
      "Acuerdos de exclusividad — alcance no competitivo, forks privados, despliegues internos.",
      "Ensamblajes a medida — elige piezas del catalogo y nosotros construimos el pegamento.",
      "Soporte extendido, canales dedicados y prioridad en los proximos lanzamientos.",
    ],
  },
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export default function ContactPage() {
  const prefersReducedMotion = useReducedMotion();
  const [warpSpeed, setWarpSpeed] = useState(1);
  const [locale, setLocale] = useState<MarketLocale>("en");

  useEffect(() => {
    const cookieValue = readCookie(MARKET_LOCALE_COOKIE);
    const normalized = normalizeMarketLocale(cookieValue);
    if (normalized) {
      setLocale(normalized);
    }
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ProductId[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = PAGE_COPY[locale];

  const handleFocusChange = useCallback((focused: boolean) => {
    setWarpSpeed(focused ? 2.5 : 1);
  }, []);

  const toggleProduct = useCallback((id: ProductId) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitContactAction({
        name,
        email,
        company: company || undefined,
        message,
        products: selectedProducts,
        locale,
      });
      if (result.ok) {
        toast.success(t(locale, PHRASES.thanks));
        setName("");
        setEmail("");
        setCompany("");
        setMessage("");
        setSelectedProducts([]);
      } else {
        toast.error(
          locale === "en"
            ? "Something went wrong — please try again."
            : "Algo salio mal — intenta de nuevo."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = useMemo(
    () => (isSubmitting ? t(locale, PHRASES.sending) : t(locale, PHRASES.sendMessage)),
    [isSubmitting, locale]
  );

  return (
    <>
      {!prefersReducedMotion && (
        <ViewTunnelIn>
          <ParticleTunnel count={1500} speed={1.2} warpSpeed={warpSpeed} />
        </ViewTunnelIn>
      )}

      <Section title={copy.title} eyebrow={copy.eyebrow} copy={copy.body} className="pb-32">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <ScrollReveal delay={100}>
            <div className="space-y-6 text-lg text-[color:var(--muted)]">
              <ul className="space-y-3 text-[1.05rem] leading-[1.7]">
                {copy.pitch.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span aria-hidden className="mt-[0.65em] block h-[1px] w-4 shrink-0 bg-[color:var(--accent)]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p>
                {locale === "en" ? "Prefer direct email?" : "Prefieres email directo?"}{" "}
                <a href="mailto:hello@cumulush.com" className="underline">
                  hello@cumulush.com
                </a>
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={200}>
            <GlassPanel>
              <div className="flex flex-col gap-8">
                <HyperInput
                  label={t(locale, PHRASES.name)}
                  value={name}
                  onChange={setName}
                  onFocusChange={handleFocusChange}
                  placeholder={locale === "en" ? "Your name" : "Tu nombre"}
                />

                <HyperInput
                  label={t(locale, PHRASES.email)}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onFocusChange={handleFocusChange}
                  placeholder="you@company.com"
                />

                <HyperInput
                  label={t(locale, PHRASES.company)}
                  value={company}
                  onChange={setCompany}
                  onFocusChange={handleFocusChange}
                  placeholder={locale === "en" ? "Your company" : "Tu empresa"}
                />

                <div className="space-y-3">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    {t(locale, PHRASES.productsOfInterest)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_ORDER.map((id) => {
                      const meta = PRODUCT_META[id];
                      const isSelected = selectedProducts.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleProduct(id)}
                          aria-pressed={isSelected}
                          className={cn(
                            "rounded-full border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] transition-colors",
                            isSelected
                              ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-white"
                              : "border-white/10 bg-white/[0.02] text-[color:var(--muted)] hover:text-white"
                          )}
                        >
                          {meta.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <HyperTextarea
                  label={t(locale, PHRASES.message)}
                  value={message}
                  onChange={setMessage}
                  onFocusChange={handleFocusChange}
                  placeholder={
                    locale === "en"
                      ? "Tell us about your team and what you need..."
                      : "Cuentanos sobre tu equipo y que necesitas..."
                  }
                  rows={4}
                />

                <div className="pt-2">
                  <LaunchButton
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!name || !email || !message}
                    className="w-full"
                  >
                    {submitLabel}
                  </LaunchButton>
                </div>
              </div>
            </GlassPanel>
          </ScrollReveal>
        </div>
      </Section>
    </>
  );
}
