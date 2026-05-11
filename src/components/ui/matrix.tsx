"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

// --- Types ---

export type Frame = number[][] // [row][col] brightness 0..1

export interface MatrixProps extends React.HTMLAttributes<HTMLDivElement> {
    rows: number
    cols: number
    pattern?: Frame
    frames?: Frame[]
    fps?: number
    autoplay?: boolean
    loop?: boolean
    size?: number
    gap?: number
    palette?: {
        on: string
        off: string
    }
    brightness?: number
    mode?: "default" | "vu"
    levels?: number[] // For VU mode: 0-1 per column
    onFrame?: (index: number) => void
    ariaLabel?: string
}

// --- Presets & Utilities ---

export const digits: Record<number, Frame> = {
    0: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
    1: [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
    ],
    2: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
    ],
    3: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 1, 1, 0],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
    4: [
        [0, 0, 0, 1, 0],
        [0, 0, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [1, 0, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0],
    ],
    5: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
    6: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
    7: [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0],
    ],
    8: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
    9: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 0],
    ],
}

export const chevronLeft: Frame = [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
]

export const chevronRight: Frame = [
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
]

function fract(value: number) {
    return value - Math.floor(value)
}

function deterministicNoise(...values: number[]) {
    const seed = values.reduce((accumulator, value, index) => accumulator + value * (12.9898 + index * 78.233), 0)
    return fract(Math.sin(seed) * 43758.5453123)
}

// Generate frames for loader animation (rotating line)
export const loader: Frame[] = Array.from({ length: 12 }, (_, frameIdx) => {
    const size = 7
    const center = 3
    const angle = (frameIdx / 12) * Math.PI * 2
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))

    // Draw line from center
    for (let r = 0; r <= center; r++) {
        const x = Math.round(center + Math.sin(angle) * r)
        const y = Math.round(center - Math.cos(angle) * r)
        if (x >= 0 && x < size && y >= 0 && y < size) {
            frame[y][x] = 1 - (r / center) * 0.5 // Fade towards edge
        }
    }
    return frame
})

// Generate frames for pulse animation
export const pulse: Frame[] = Array.from({ length: 16 }, (_, frameIdx) => {
    const size = 7
    const center = 3
    const maxRadius = 5
    const radius = (frameIdx / 16) * maxRadius
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const d = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2))
            const brightness = Math.max(0, 1 - Math.abs(d - radius))
            frame[y][x] = brightness > 0.8 ? 1 : brightness < 0.2 ? 0 : brightness
        }
    }
    return frame
})

// Generate frames for wave animation
export const wave: Frame[] = Array.from({ length: 24 }, (_, frameIdx) => {
    const size = 7
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
    const phase = (frameIdx / 24) * Math.PI * 2

    for (let x = 0; x < size; x++) {
        const yVal = Math.sin(phase + (x / size) * Math.PI * 2)
        // Map -1..1 to 0..6
        const centerY = (yVal + 1) / 2 * (size - 1)

        for (let y = 0; y < size; y++) {
            const dist = Math.abs(y - centerY)
            frame[y][x] = Math.max(0, 1 - dist)
        }
    }
    return frame
})

// Generate frames for snake animation
export const snake: Frame[] = (() => {
    const size = 7
    const path: [number, number][] = []
    // Create snake path (serpentine)
    for (let y = 0; y < size; y++) {
        if (y % 2 === 0) {
            for (let x = 0; x < size; x++) path.push([y, x])
        } else {
            for (let x = size - 1; x >= 0; x--) path.push([y, x])
        }
    }

    const snakeLen = 4
    const frames: Frame[] = []

    for (let offset = 0; offset < path.length + snakeLen; offset++) {
        const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
        for (let i = 0; i < snakeLen; i++) {
            const idx = offset - i
            if (idx >= 0 && idx < path.length) {
                const [y, x] = path[idx]
                frame[y][x] = 1 - (i / snakeLen)
            }
        }
        frames.push(frame)
    }
    return frames
})()


// Generate frames for signal animation (deterministic noise/static)
export const signal: Frame[] = Array.from({ length: 12 }, (_, frameIdx) => {
    const size = 15 // Increased default resolution for patterns
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const density = deterministicNoise(frameIdx, x, y)
            const intensity = deterministicNoise(frameIdx + 17, x + 11, y + 23)
            frame[y][x] = density > 0.3 ? 0.2 + intensity * 0.8 : 0.1
        }
    }
    return frame
})

// Generate frames for rain animation (digital rain)
export const rain: Frame[] = (() => {
    const size = 15
    const framesCount = 20
    const drops = Array.from({ length: size }, (_, x) => Math.floor(deterministicNoise(x, size, framesCount) * size))

    return Array.from({ length: framesCount }, () => {
        const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))

        for (let x = 0; x < size; x++) {
            // Move drops down
            drops[x] = (drops[x] + 1) % (size + 5) // +5 for pause off-screen

            // Draw trail
            for (let i = 0; i < 5; i++) {
                const y = drops[x] - i
                if (y >= 0 && y < size) {
                    frame[y][x] = Math.max(0.1, 1 - (i / 5))
                }
            }
            // Fill background slightly
            for (let y = 0; y < size; y++) {
                if (frame[y][x] === 0) frame[y][x] = 0.05
            }
        }
        return frame
    })
})()

// Generate frames for forcefield (ripples with base energy)
export const forcefield: Frame[] = Array.from({ length: 20 }, (_, i) => {
    const size = 15
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
    const phase = (i / 20) * Math.PI * 4
    const center = size / 2

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2)
            const ripple = Math.sin(dist - phase)
            // Map sine [-1, 1] to brightness [0.2, 1] so it's always lit
            frame[y][x] = 0.2 + (ripple + 1) * 0.4
        }
    }
    return frame
})

// Generate frames for DNA animation (double helix)
export const dna: Frame[] = Array.from({ length: 24 }, (_, i) => {
    const size = 15
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
    const phase = (i / 24) * Math.PI * 2

    for (let x = 0; x < size; x++) {
        // Strand 1
        const y1 = (Math.sin(phase + (x / size) * Math.PI * 4) + 1) / 2 * (size - 1)
        // Strand 2 (offset)
        const y2 = (Math.sin(phase + (x / size) * Math.PI * 4 + Math.PI) + 1) / 2 * (size - 1)

        const r1 = Math.round(y1)
        const r2 = Math.round(y2)

        if (r1 >= 0 && r1 < size) frame[r1][x] = 1
        if (r2 >= 0 && r2 < size) frame[r2][x] = 1

        // Connect strands (rungs) every few columns
        if (x % 3 === 0) {
            const min = Math.min(r1, r2)
            const max = Math.max(r1, r2)
            for (let y = min; y <= max; y++) {
                frame[y][x] = Math.max(frame[y][x], 0.3) // Dimmer rungs
            }
        }
    }
    return frame
})

// Generate frames for radar animation (rotating scan)
export const radar: Frame[] = Array.from({ length: 24 }, (_, i) => {
    const size = 15
    const center = 7
    const frame: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
    const angle = (i / 24) * Math.PI * 2

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - center
            const dy = y - center
            const r = Math.sqrt(dx * dx + dy * dy)

            // Current angle of this pixel
            let theta = Math.atan2(dy, dx)
            if (theta < 0) theta += Math.PI * 2

            // Normalize angle relative to scan line
            let diff = angle - theta
            if (diff < 0) diff += Math.PI * 2

            // Draw scan line and trailing fade
            if (diff < 0.5 && r < center) {
                frame[y][x] = 1 // Leading edge
            } else if (diff < 1.5 && r < center) {
                frame[y][x] = Math.max(0.1, 1 - diff) // Trail
            }

            // Base grid ring
            if (Math.abs(r - center + 1) < 0.5) frame[y][x] = Math.max(frame[y][x], 0.2)
        }
    }
    return frame
})


export function vu(rows: number, levels: number[]): Frame {
    const frame: number[][] = []
    for (let y = 0; y < rows; y++) {
        const row: number[] = []
        for (let x = 0; x < levels.length; x++) {
            // 0 at bottom (row = rows-1), 1 at top (row = 0)
            const threshold = 1 - (levels[x] || 0)
            const rowPos = y / (rows - 1)
            row.push(rowPos >= threshold ? 1 : 0.1) // 0.1 for subtle background
        }
        frame.push(row)
    }
    return frame
}


// --- Component ---

export function Matrix({
    rows,
    cols,
    pattern,
    frames,
    fps = 12,
    autoplay = true,
    loop = true,
    size = 10,
    gap = 2,
    palette = { on: "currentColor", off: "var(--muted-foreground)" },
    brightness = 1,
    mode = "default",
    levels,
    onFrame,
    className,
    ariaLabel,
    "aria-label": htmlAriaLabel,
    ...props
}: MatrixProps) {
    const [currentFrameIdx, setCurrentFrameIdx] = useState(0)
    const requestRef = useRef<number>(0)
    const previousTimeRef = useRef<number>(0)
    const accumulatorRef = useRef<number>(0)

    // Determine current frame data
    const frameData = useMemo(() => {
        if (mode === "vu" && levels) {
            return vu(rows, levels)
        }
        if (pattern) {
            return pattern
        }
        if (frames && frames.length > 0) {
            return frames[currentFrameIdx % frames.length]
        }
        // Empty frame
        return Array(rows).fill(0).map(() => Array(cols).fill(0))
    }, [mode, levels, pattern, frames, currentFrameIdx, rows, cols])

    // Animation Loop
    const animate = useCallback(function step(time: number) {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current
            accumulatorRef.current += deltaTime

            const frameDuration = 1000 / fps

            if (accumulatorRef.current >= frameDuration) {
                if (frames && frames.length > 0) {
                    setCurrentFrameIdx(prev => {
                        const next = prev + 1
                        if (!loop && next >= frames.length) return prev
                        if (onFrame) onFrame(next % frames.length)
                        return next
                    })
                }
                accumulatorRef.current %= frameDuration
            }
        }
        previousTimeRef.current = time
        requestRef.current = requestAnimationFrame(step)
    }, [fps, frames, loop, onFrame])

    useEffect(() => {
        if (autoplay && frames && frames.length > 1 && mode !== "vu") {
            requestRef.current = requestAnimationFrame(animate)
        } else {
            // Reset if switching modes
            setCurrentFrameIdx(0)
        }
        return () => cancelAnimationFrame(requestRef.current)
    }, [autoplay, frames, mode, animate])


    // Render
    const totalWidth = cols * size + (cols - 1) * gap
    const totalHeight = rows * size + (rows - 1) * gap

    return (
        <div
            className={cn("inline-flex items-center justify-center", className)}
            role="img"
            aria-label={ariaLabel || htmlAriaLabel || "Dot Matrix Display"}
            aria-live={frames ? "polite" : undefined}
            {...props}
        >
            <svg
                width={totalWidth}
                height={totalHeight}
                viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                style={{ display: "block" }}
            >
                {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: cols }).map((_, c) => {
                        const cellBrightness = (frameData[r]?.[c] ?? 0) * brightness
                        const isOn = cellBrightness > 0
                        const fillColor = isOn ? palette.on : palette.off
                        const opacity = isOn ? Number(cellBrightness.toFixed(3)) : 0.2 // Round for stable SSR/client SVG markup

                        return (
                            <circle
                                key={`${r}-${c}`}
                                cx={c * (size + gap) + size / 2}
                                cy={r * (size + gap) + size / 2}
                                r={size / 2}
                                fill={fillColor}
                                fillOpacity={opacity}
                                className="transition-colors duration-100"
                            />
                        )
                    })
                )}
            </svg>
        </div>
    )
}
