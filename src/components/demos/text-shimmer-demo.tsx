"use client"

import { useMemo, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ShimmeringText } from "@/components/ui/shimmering-text"

export function TextShimmerDemo() {
    const [currentIndex, setCurrentIndex] = useState(0)

    const phrases = useMemo(() => [
        "Agent is thinking...",
        "Processing your request...",
        "Analyzing the data...",
        "Generating response...",
        "Almost there..."
    ], [])

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % phrases.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [phrases.length])

    return (
        <div className="bg-card w-full rounded-lg border p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Text Shimmer Effect</h3>
                <p className="text-muted-foreground text-sm">Animated gradient text with automatic cycling</p>
            </div>

            <div className="bg-muted/10 flex items-center justify-center rounded-lg py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ShimmeringText
                            text={phrases[currentIndex]}
                            className="text-xl font-medium"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
