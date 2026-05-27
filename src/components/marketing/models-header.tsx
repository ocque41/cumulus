"use client";

import { ScrollReveal, ScrambleText } from "@/components/animation";

export function ModelsHeader() {
    return (
        <section className="relative z-10 flex flex-col items-center pt-32 pb-16">
            <ScrollReveal direction="down">
                <div className="text-center space-y-6 px-6">
                    <div className="flex items-center justify-center gap-3 text-[color:var(--subtitle)]">
                        <span className="h-px w-12 bg-white/20" />
                        <span className="font-mono text-sm uppercase tracking-[0.3em]">
                            Cumulus Create
                        </span>
                        <span className="h-px w-12 bg-white/20" />
                    </div>
                    <h1 className="display text-[color:var(--title)]">
                        <ScrambleText scrambleDuration={1500}>
                            Build the command
                        </ScrambleText>
                    </h1>
                    <p className="lead max-w-xl mx-auto text-[color:var(--subtitle)]">
                        npm create @cmls@latest my-acme
                    </p>
                </div>
            </ScrollReveal>
        </section>
    );
}
