"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animate } from "animejs";

import { cn } from "@/lib/utils";
import { VoxelCloud } from "@/components/three/voxel-cloud";

interface AntigravitySceneProps {
    /** Additional CSS classes */
    className?: string;
    /** Number of voxels to render */
    voxelCount?: number;
    /** Enable ambient rotation */
    enableAmbientRotation?: boolean;
}

/**
 * Ambient float animation for the voxel group.
 * Replaces @react-three/drei Float component.
 */
function FloatingGroup({
    children,
    speed = 0.5,
    rotationIntensity = 0.3,
    floatIntensity = 0.5
}: {
    children: React.ReactNode;
    speed?: number;
    rotationIntensity?: number;
    floatIntensity?: number;
}) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime() * speed;

        groupRef.current.position.y = Math.sin(t) * floatIntensity * 0.3;
        groupRef.current.rotation.y = Math.sin(t * 0.5) * rotationIntensity * 0.2;
        groupRef.current.rotation.x = Math.cos(t * 0.3) * rotationIntensity * 0.1;
    });

    return <group ref={groupRef}>{children}</group>;
}

/**
 * The Antigravity Scene - a complete immersive voxel cloud background.
 * 
 * This is the main canvas component that combines:
 * - VoxelCloud with InstancedMesh (2000+ voxels)
 * - Antigravity cursor repulsion physics
 * - Ambient rotation and lighting
 */
export function AntigravityScene({
    className,
    voxelCount = 2000,
    enableAmbientRotation = true,
}: AntigravitySceneProps) {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
    const pointerAnimated = useRef({ x: 0, y: 0, z: 0 });

    // Detect reduced motion preference
    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(query.matches);

        const handler = () => setPrefersReducedMotion(query.matches);
        query.addEventListener("change", handler);
        return () => query.removeEventListener("change", handler);
    }, []);

    // Animate pointer position with spring physics
    useEffect(() => {
        if (prefersReducedMotion || typeof window === "undefined") return;

        const handlePointerMove = (event: PointerEvent) => {
            const targetX = (event.clientX / window.innerWidth - 0.5) * 12;
            const targetY = -(event.clientY / window.innerHeight - 0.5) * 8;

            animate(pointerAnimated.current, {
                x: targetX,
                y: targetY,
                z: 0,
                duration: 1000,
                easing: "easeOutElastic(1, .6)",
            });
        };

        const handlePointerLeave = () => {
            animate(pointerAnimated.current, {
                x: 0,
                y: 0,
                z: 0,
                duration: 800,
                easing: "easeOutQuart",
            });
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerleave", handlePointerLeave);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerleave", handlePointerLeave);
        };
    }, [prefersReducedMotion]);

    // Reduced motion fallback
    if (prefersReducedMotion) {
        return (
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 -z-10",
                    "[mask-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_74%)]",
                    className
                )}
                aria-hidden
            >
                <div
                    className="h-full w-full bg-[radial-gradient(circle_at_50%_40%,rgba(222,221,217,0.26),rgba(23,23,23,0.92))]"
                    style={{ opacity: 0.22 }}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 -z-10",
                "[mask-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_74%)]",
                className
            )}
            aria-hidden
        >
            <Canvas
                className="h-full w-full"
                style={{ opacity: 0.35, mixBlendMode: "screen" }}
                gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
                dpr={[1, 1.5]}
                camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 100 }}
                performance={{ min: 0.5 }}
            >
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={0.3} color="#9cd9ff" />
                    <directionalLight position={[-10, -10, -5]} intensity={0.15} color="#ffe1c4" />

                    {/* The Voxel Cloud with Antigravity */}
                    <FloatingGroup
                        speed={enableAmbientRotation ? 0.5 : 0}
                        rotationIntensity={enableAmbientRotation ? 0.3 : 0}
                        floatIntensity={enableAmbientRotation ? 0.5 : 0}
                    >
                        <VoxelCloud
                            count={voxelCount}
                            spread={8}
                            baseHue={210}
                            mousePosition={pointerAnimated}
                            repulsionStrength={0.8}
                            repulsionRadius={3}
                        />
                    </FloatingGroup>
                </Suspense>
            </Canvas>
        </div>
    );
}
