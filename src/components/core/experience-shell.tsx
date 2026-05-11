"use client";

import { useRef, Suspense, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { engine } from "animejs";
import * as THREE from "three";

import { ViewTunnelOut } from "./view-tunnel";
import { useReducedMotion } from "@/hooks";

interface ExperienceShellProps {
    children: ReactNode;
}

/**
 * Syncs Anime.js engine with R3F render loop.
 * Placed inside the Canvas to tick on every frame.
 */
function EngineSync() {
    useFrame(() => {
        // Sync Anime.js engine with R3F loop
        // This ensures DOM animations are perfectly aligned with 3D physics
        try {
            engine.update();
        } catch {
            // Engine might not be initialized yet
        }
    });
    return null;
}

/**
 * Global lighting and environment setup.
 */
function GlobalScene() {
    return (
        <>
            {/* Ambient fill */}
            <ambientLight intensity={0.4} />

            {/* Key light - warm toplight */}
            <directionalLight
                position={[10, 15, 10]}
                intensity={0.6}
                color="#fff5eb"
                castShadow={false}
            />

            {/* Fill light - cool side */}
            <directionalLight
                position={[-10, 5, -10]}
                intensity={0.3}
                color="#9cd9ff"
            />

            {/* Rim light - edge definition */}
            <pointLight position={[0, -10, 5]} intensity={0.2} color="#a78bfa" />
        </>
    );
}

/**
 * ExperienceShell - The persistent WebGL context wrapper.
 * 
 * This component:
 * - Provides a global Canvas that persists across route transitions
 * - Syncs Anime.js engine with the render loop
 * - Provides consistent lighting across all 3D content
 * - Renders content tunneled from leaf pages via ViewTunnel
 */
export function ExperienceShell({ children }: ExperienceShellProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="relative w-full min-h-screen" style={{ background: 'var(--bg)' }}>
            {/* The Global Canvas - background layer */}
            {!prefersReducedMotion && (
                <div
                    className="fixed inset-0 z-0 pointer-events-none"
                    aria-hidden
                    style={{ touchAction: "none" }}
                >
                    <Canvas
                        className="w-full h-full"
                        gl={{
                            antialias: true,
                            alpha: true,
                            powerPreference: "high-performance",
                            stencil: false,
                            depth: true,
                        }}
                        dpr={[1, 1.5]}
                        camera={{
                            position: [0, 0, 12],
                            fov: 50,
                            near: 0.1,
                            far: 1000,
                        }}
                        style={{ background: "transparent" }}
                        onCreated={({ gl }) => {
                            gl.toneMapping = THREE.ACESFilmicToneMapping;
                            gl.toneMappingExposure = 1.2;
                        }}
                    >
                        <Suspense fallback={null}>
                            {/* Global scene setup */}
                            <GlobalScene />

                            {/* Anime.js engine sync */}
                            <EngineSync />

                            {/* Tunneled content from pages */}
                            <ViewTunnelOut />
                        </Suspense>
                    </Canvas>
                </div>
            )}

            {/* DOM content layer - on top of Canvas */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
