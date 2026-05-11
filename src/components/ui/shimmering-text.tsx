"use client"

import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useMemo } from "react"

export interface ShimmeringTextProps {
    text: string
    duration?: number
    delay?: number
    repeat?: boolean
    repeatDelay?: number
    className?: string
    startOnView?: boolean
    once?: boolean
    inViewMargin?: string
    spread?: number
    color?: string
    shimmerColor?: string
}

export function ShimmeringText({
    text,
    duration = 2,
    delay = 0,
    repeat = true,
    repeatDelay = 0.5,
    className,
    startOnView = true,
    once = false,
    inViewMargin = "0px",
    spread = 3,
    color = "var(--text)",
    shimmerColor = "var(--bg)",
}: ShimmeringTextProps) {
    const backgroundSize = useMemo(() => {
        return `${100 * spread}%`
    }, [spread])

    return (
        <motion.div
            className={cn(
                "inline-block bg-clip-text text-transparent bg-no-repeat",
                className
            )}
            style={{
                backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} 45%, ${shimmerColor} 50%, ${color} 55%, ${color} 100%)`,
                backgroundSize: `${backgroundSize} 100%`,
                willChange: "background-position",
                transform: "translateZ(0)", // Force GPU acceleration
                // @ts-ignore
                "--base-color": color,
                "--shimmer-color": shimmerColor,
            }}
            initial={{ backgroundPosition: "100% center" }}
            whileInView={startOnView ? { backgroundPosition: "0% center" } : undefined}
            animate={!startOnView ? { backgroundPosition: "0% center" } : undefined}
            viewport={{ once, margin: inViewMargin as any }}
            transition={{
                duration,
                delay,
                ease: "linear",
                repeat: repeat ? Infinity : 0,
                repeatDelay,
            }}
        >
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={text}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="block"
                >
                    {text}
                </motion.span>
            </AnimatePresence>
        </motion.div>
    )
}
