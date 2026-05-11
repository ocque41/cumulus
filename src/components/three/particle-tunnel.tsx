"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { cn } from "@/lib/utils";

interface ParticleTunnelProps {
    className?: string;
    /** Base speed of particles */
    speed?: number;
    /** Number of particles */
    count?: number;
    /** Current warp speed multiplier (controlled by form focus) */
    warpSpeed?: number;
}

/**
 * Particle field that streams towards the camera creating a tunnel effect.
 */
function ParticleField({
    count = 1000,
    speed = 1,
    warpSpeed = 1,
}: {
    count: number;
    speed: number;
    warpSpeed: number;
}) {
    const pointsRef = useRef<THREE.Points>(null);
    const velocityRef = useRef<Float32Array>(new Float32Array(count));

    // Generate initial positions
    const [positions, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Random position in cylinder
            const theta = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 6;

            positions[i3] = Math.cos(theta) * radius;
            positions[i3 + 1] = Math.sin(theta) * radius;
            positions[i3 + 2] = (Math.random() - 0.5) * 40; // Depth

            // Burnt-sienna palette (#a44718) with slight brightness drift per particle.
            const t = Math.random();
            colors[i3] = 0.643 + t * 0.12; // R: 164/255 ± drift
            colors[i3 + 1] = 0.278 + t * 0.08; // G: 71/255 ± drift
            colors[i3 + 2] = 0.094 + t * 0.05; // B: 24/255 ± drift

            // Random velocity
            velocities[i] = 0.02 + Math.random() * 0.04;
        }

        velocityRef.current = velocities;
        return [positions, colors];
    }, [count]);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const array = positionAttr.array as Float32Array;
        const time = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const velocity = velocityRef.current[i] * speed * warpSpeed;

            // Move towards camera
            array[i3 + 2] += velocity;

            // Reset when passing camera
            if (array[i3 + 2] > 20) {
                array[i3 + 2] = -20;
            }

            // Slight spiral motion
            const theta = Math.atan2(array[i3 + 1], array[i3]);
            const radius = Math.sqrt(array[i3] ** 2 + array[i3 + 1] ** 2);
            const newTheta = theta + 0.001 * warpSpeed;

            array[i3] = Math.cos(newTheta) * radius;
            array[i3 + 1] = Math.sin(newTheta) * radius;
        }

        positionAttr.needsUpdate = true;

        // Pulse opacity based on warp speed
        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.1 + (warpSpeed - 1) * 0.1;
        material.size = 0.03 + (warpSpeed - 1) * 0.01;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                transparent
                opacity={0.7}
                vertexColors
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}



/**
 * Particle Tunnel / Wormhole background for the Contact page.
 * 
 * The tunnel speed can be controlled by form interactions,
 * creating a sense of "data transmission" during input.
 * 
 * Note: This component must be rendered inside a R3F Canvas or via ViewTunnel.
 */
export function ParticleTunnel({
    speed = 1,
    count = 1500,
    warpSpeed = 1,
}: Omit<ParticleTunnelProps, 'className'>) {
    return (
        <group>
            {/* Background color managed by global scene/environment or CSS */}

            <ParticleField count={count} speed={speed} warpSpeed={warpSpeed} />
        </group>
    );
}
