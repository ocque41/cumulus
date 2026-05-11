"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animate, createTimeline, stagger } from "animejs";

import { cn } from "@/lib/utils";

interface RuneArtifactProps {
    className?: string;
    /** Enable orbit rotation on drag */
    enableOrbit?: boolean;
    /** Initial exploded state */
    exploded?: boolean;
}

/**
 * A single component of the Rune artifact (procedural geometry).
 */
function RuneComponent({
    position,
    geometry,
    color,
    emissiveIntensity = 0,
    explodedOffset,
    isExploded,
}: {
    position: [number, number, number];
    geometry: "core" | "ring" | "panel" | "cap";
    color: string;
    emissiveIntensity?: number;
    explodedOffset: [number, number, number];
    isExploded: boolean;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const targetPosition = useRef(new THREE.Vector3(...position));

    useEffect(() => {
        if (isExploded) {
            targetPosition.current.set(
                position[0] + explodedOffset[0],
                position[1] + explodedOffset[1],
                position[2] + explodedOffset[2]
            );
        } else {
            targetPosition.current.set(...position);
        }
    }, [isExploded, position, explodedOffset]);

    useFrame(() => {
        if (!meshRef.current) return;
        meshRef.current.position.lerp(targetPosition.current, 0.08);
    });

    const geo = (() => {
        switch (geometry) {
            case "core":
                return <boxGeometry args={[0.8, 0.8, 0.8]} />;
            case "ring":
                return <torusGeometry args={[0.6, 0.08, 16, 48]} />;
            case "panel":
                return <boxGeometry args={[1.2, 0.05, 0.8]} />;
            case "cap":
                return <cylinderGeometry args={[0.3, 0.4, 0.15, 6]} />;
        }
    })();

    return (
        <mesh ref={meshRef} position={position}>
            {geo}
            <meshStandardMaterial
                color={color}
                metalness={0.8}
                roughness={0.2}
                emissive={color}
                emissiveIntensity={emissiveIntensity}
            />
        </mesh>
    );
}

/**
 * The 3D Rune artifact model (procedural).
 * 
 * Composed of multiple components that can explode apart.
 */
function RuneModel({ isExploded }: { isExploded: boolean }) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    // Slow rotation
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.rotation.y = t * 0.15;

        // Subtle floating
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
    });

    const components = [
        // Core
        { position: [0, 0, 0] as [number, number, number], geometry: "core" as const, color: "#00F3FF", emissiveIntensity: 0.5, explodedOffset: [0, 0, 0] as [number, number, number] },
        // Top ring
        { position: [0, 0.5, 0] as [number, number, number], geometry: "ring" as const, color: "#4B0082", emissiveIntensity: 0.2, explodedOffset: [0, 1.2, 0] as [number, number, number] },
        // Bottom ring
        { position: [0, -0.5, 0] as [number, number, number], geometry: "ring" as const, color: "#4B0082", emissiveIntensity: 0.2, explodedOffset: [0, -1.2, 0] as [number, number, number] },
        // Side panels
        { position: [0.7, 0, 0] as [number, number, number], geometry: "panel" as const, color: "#1a1a2e", emissiveIntensity: 0, explodedOffset: [1.5, 0, 0] as [number, number, number] },
        { position: [-0.7, 0, 0] as [number, number, number], geometry: "panel" as const, color: "#1a1a2e", emissiveIntensity: 0, explodedOffset: [-1.5, 0, 0] as [number, number, number] },
        // Caps
        { position: [0, 0.8, 0] as [number, number, number], geometry: "cap" as const, color: "#deddd9", emissiveIntensity: 0, explodedOffset: [0, 1.8, 0] as [number, number, number] },
        { position: [0, -0.8, 0] as [number, number, number], geometry: "cap" as const, color: "#deddd9", emissiveIntensity: 0, explodedOffset: [0, -1.8, 0] as [number, number, number] },
    ];

    return (
        <group
            ref={groupRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {components.map((comp, i) => (
                <RuneComponent
                    key={i}
                    position={comp.position}
                    geometry={comp.geometry}
                    color={comp.color}
                    emissiveIntensity={hovered ? comp.emissiveIntensity * 1.5 : comp.emissiveIntensity}
                    explodedOffset={comp.explodedOffset}
                    isExploded={isExploded}
                />
            ))}
        </group>
    );
}

/**
 * SVG Spec Lines that appear during exploded view.
 */
function SpecLines({ visible }: { visible: boolean }) {
    const linesRef = useRef<(SVGPathElement | null)[]>([]);

    useEffect(() => {
        if (!visible) return;

        linesRef.current.forEach((line, i) => {
            if (!line) return;
            const length = line.getTotalLength();
            line.style.strokeDasharray = `${length}`;
            line.style.strokeDashoffset = `${length}`;

            animate(line, {
                strokeDashoffset: [length, 0],
                duration: 800,
                delay: i * 150,
                easing: "easeOutQuart",
            });
        });
    }, [visible]);

    const lines = [
        { d: "M 180 80 L 280 50", label: "Quantum Core", labelPos: { x: 285, y: 55 } },
        { d: "M 180 160 L 300 140", label: "Sync Rings", labelPos: { x: 305, y: 145 } },
        { d: "M 220 120 L 320 100", label: "Neural Matrix", labelPos: { x: 325, y: 105 } },
        { d: "M 140 80 L 60 50", label: "Power Cell", labelPos: { x: 10, y: 55 } },
        { d: "M 140 160 L 40 180", label: "Data Bus", labelPos: { x: 10, y: 185 } },
    ];

    return (
        <svg
            className={cn(
                "absolute inset-0 pointer-events-none transition-opacity duration-500",
                visible ? "opacity-100" : "opacity-0"
            )}
            viewBox="0 0 400 240"
        >
            {lines.map((line, i) => (
                <g key={i}>
                    <path
                        ref={(el) => { linesRef.current[i] = el; }}
                        d={line.d}
                        fill="none"
                        stroke="#00F3FF"
                        strokeWidth="1"
                        className="spec-line"
                    />
                    <text
                        x={line.labelPos.x}
                        y={line.labelPos.y}
                        fill="#00F3FF"
                        fontSize="10"
                        fontFamily="monospace"
                        className={cn(
                            "transition-opacity duration-300",
                            visible ? "opacity-100" : "opacity-0"
                        )}
                        style={{ transitionDelay: `${400 + i * 150}ms` }}
                    >
                        {line.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

/**
 * Complete Rune Artifact showcase with 3D model and exploded view.
 */
export function RuneArtifact({
    className,
    enableOrbit = true,
    exploded: initialExploded = false,
}: RuneArtifactProps) {
    const [isExploded, setIsExploded] = useState(initialExploded);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(query.matches);
    }, []);

    return (
        <div className={cn("relative w-full aspect-[4/3]", className)}>
            {/* 3D Canvas */}
            <Canvas
                className="w-full h-full"
                camera={{ position: [0, 0, 4], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
            >
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
                    <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#00F3FF" />
                    <pointLight position={[0, 0, 2]} intensity={0.5} color="#00F3FF" />

                    {/* The Rune Model */}
                    <RuneModel isExploded={isExploded} />
                </Suspense>
            </Canvas>

            {/* SVG Spec Lines Overlay */}
            <SpecLines visible={isExploded} />

            {/* Inspect Button */}
            <button
                onClick={() => setIsExploded(!isExploded)}
                className={cn(
                    "absolute bottom-4 right-4 px-4 py-2 rounded-lg",
                    "font-mono text-xs uppercase tracking-widest",
                    "transition-colors duration-200",
                    isExploded
                        ? "bg-[#00F3FF] text-black"
                        : "bg-white/10 text-white hover:bg-white/20",
                    "border border-white/20"
                )}
            >
                {isExploded ? "Collapse" : "Inspect"}
            </button>

            {/* Component Labels */}
            <div className={cn(
                "absolute bottom-4 left-4 space-y-1 transition-opacity duration-300",
                isExploded ? "opacity-100" : "opacity-0"
            )}>
                <div className="font-mono text-[10px] text-[#00F3FF] uppercase tracking-widest">
                    Components: 7
                </div>
                <div className="font-mono text-[10px] text-white/60 uppercase tracking-widest">
                    Status: Exploded View
                </div>
            </div>
        </div>
    );
}
