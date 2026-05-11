"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { createTimeline, animate, random } from "animejs";

export function BottomRightCard() {
    const cardRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const glitchRef = useRef<any>(null); // Store glitch animation instance

    useEffect(() => {
        if (!cardRef.current || !imageRef.current) return;

        // Reset state
        const timeline = createTimeline({
            defaults: {
                duration: 1600,
                ease: "easeOutElastic(1, .6)"
            }
        });

        timeline
            .add(cardRef.current, {
                opacity: [0, 1],
                rotate: [15, 0],
                scale: [0.5, 1],
                duration: 1800
            }, 0)
            .add(imageRef.current, {
                filter: ["blur(20px)", "blur(0px)"],
                translateY: [100, 0],
                rotateZ: [-10, 0],
                opacity: [0, 1]
            }, "-=1400");

        timeline.init();

    }, []);

    const handleMouseEnter = () => {
        if (!imageRef.current) return;

        // Crazy Glitch Effect on Hover
        glitchRef.current = animate(imageRef.current, {
            translateX: () => random(-5, 5),
            translateY: () => random(-5, 5),
            scale: () => random(0.95, 1.05),
            filter: ["hue-rotate(0deg)", () => `hue-rotate(${random(-45, 45)}deg)`],
            duration: 50,
            direction: 'alternate',
            loop: true,
            ease: 'steps(2)'
        });
    };

    const handleMouseLeave = () => {
        if (glitchRef.current) {
            glitchRef.current.pause();
        }
        if (!imageRef.current) return;

        // Reset
        animate(imageRef.current, {
            translateX: 0,
            translateY: 0,
            scale: 1,
            filter: "hue-rotate(0deg)",
            duration: 300,
            ease: "easeOutQuad"
        });
    };

    return (
        <div
            ref={cardRef}
            className="w-full h-full flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-[5.5px] border border-white/5 overflow-hidden group hover:border-white/10 transition-colors duration-500"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 w-full max-w-[350px] aspect-square flex items-center justify-center">
                <Image
                    ref={imageRef}
                    src="/assets/dashboard/bottom-right.png"
                    alt="System Core"
                    width={500}
                    height={500}
                    className="w-full h-full object-contain drop-shadow-2xl"
                    priority
                />
            </div>
        </div>
    );
}
