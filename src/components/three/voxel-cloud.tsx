"use client";

import { useRef, useMemo, useEffect, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface VoxelCloudProps {
    /** Number of voxels to render */
    count?: number;
    /** Spread radius of the cloud */
    spread?: number;
    /** Base hue for non-glass palettes */
    baseHue?: number;
    /** Mouse position ref for Antigravity effect */
    mousePosition?: MutableRefObject<{ x: number; y: number; z: number }>;
    /** Antigravity repulsion strength */
    repulsionStrength?: number;
    /** Antigravity repulsion radius */
    repulsionRadius?: number;
    /** Stable material look for the background scene */
    materialPreset?: "default" | "liquid-glass";
    /** Overall scene movement intensity */
    motionStrength?: number;
}

// Seeded random for consistent cloud generation
function createSeededRandom(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * High-performance voxel cloud using InstancedMesh.
 * Renders thousands of cubes in a single draw call.
 * 
 * Features:
 * - GPU-optimized InstancedMesh rendering
 * - Cursor repulsion ("Antigravity") effect
 * - Organic turbulence animation
 * - Entrance animation with stagger (frame-based)
 */
export function VoxelCloud({
    count = 2000,
    spread = 8,
    baseHue = 210,
    mousePosition,
    repulsionStrength = 0.8,
    repulsionRadius = 2.5,
    materialPreset = "default",
    motionStrength = 0.8,
}: VoxelCloudProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummyObjectRef = useRef(new THREE.Object3D());

    // Store original positions for repulsion calculations
    const originalPositions = useRef<Float32Array | null>(null);
    const currentPositions = useRef<Float32Array | null>(null);
    const velocities = useRef<Float32Array | null>(null);
    const entranceDelays = useRef<Float32Array | null>(null);
    const entranceProgress = useRef<Float32Array | null>(null);

    // Reusable vectors to avoid GC
    const tmpPos = useMemo(() => new THREE.Vector3(), []);
    const tmpTarget = useMemo(() => new THREE.Vector3(), []);
    const tmpVelocity = useMemo(() => new THREE.Vector3(), []);
    const tmpMouse = useMemo(() => new THREE.Vector3(), []);
    const tmpRepulsion = useMemo(() => new THREE.Vector3(), []);

    // Generate voxel data with seeded random
    const voxelData = useMemo(() => {
        const random = createSeededRandom(42);

        const palette =
            materialPreset === "liquid-glass"
                ? [0x6e6e6e, 0x9d9d9d, 0xd7d7d7, 0xf4f4f4]
                : [0x111111, 0x222222, 0x333333, 0x444444, 0x555555, 0x666666];
        const colorStart =
            materialPreset === "liquid-glass"
                ? new THREE.Color("#666666")
                : new THREE.Color().setHSL(baseHue / 360, 0.05, 0.07);
        const colorEnd =
            materialPreset === "liquid-glass"
                ? new THREE.Color("#f5f5f5")
                : new THREE.Color().setHSL(baseHue / 360, 0.06, 0.4);

        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Spherical distribution for cloud-like shape
            const theta = random() * Math.PI * 2;
            const phi = Math.acos(2 * random() - 1);
            const r = Math.pow(random(), 0.5) * spread;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten Y
            const z = r * Math.cos(phi) * 0.8;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            sizes[i] =
                materialPreset === "liquid-glass"
                    ? 0.09 + random() * 0.12
                    : 0.08 + random() * 0.15;

            // Mix between gradient and specific palette entries
            let c;
            if (random() > 0.5) {
                c = colorStart.clone().lerp(colorEnd, random());
            } else {
                c = new THREE.Color(palette[Math.floor(random() * palette.length)]);
            }
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        return { positions, sizes, colors };
    }, [count, spread, materialPreset, baseHue]);

    // Initialize instances
    useEffect(() => {
        const mesh = meshRef.current;
        const dummyObject = dummyObjectRef.current;
        if (!mesh) return;

        // Initialize typed arrays
        originalPositions.current = new Float32Array(voxelData.positions);
        currentPositions.current = new Float32Array(voxelData.positions);
        velocities.current = new Float32Array(count * 3); // 0,0,0
        entranceDelays.current = new Float32Array(count);
        entranceProgress.current = new Float32Array(count);

        // Randomize delays for stagger effect
        for (let i = 0; i < count; i++) {
            entranceDelays.current[i] = i * 0.002; // Simple linear stagger spread over time
            // Or random: Math.random() * 2.0; 
        }

        // Set initial colors and reset matrices
        for (let i = 0; i < count; i++) {
            dummyObject.position.set(
                voxelData.positions[i * 3],
                voxelData.positions[i * 3 + 1],
                voxelData.positions[i * 3 + 2]
            );
            dummyObject.scale.setScalar(0); // Start at 0 scale
            dummyObject.updateMatrix();
            mesh.setMatrixAt(i, dummyObject.matrix);

            const color = new THREE.Color(
                voxelData.colors[i * 3],
                voxelData.colors[i * 3 + 1],
                voxelData.colors[i * 3 + 2]
            );
            mesh.setColorAt(i, color);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    }, [voxelData, count]);

    // Animate per frame
    useFrame((state, delta) => {
        const mesh = meshRef.current;
        if (!mesh || !originalPositions.current || !currentPositions.current || !velocities.current || !entranceDelays.current || !entranceProgress.current) return;

        const time = state.clock.getElapsedTime();
        const mousePos = mousePosition?.current || { x: 0, y: 0, z: 0 };
        const dummyObject = dummyObjectRef.current;
        tmpMouse.set(mousePos.x, mousePos.y, mousePos.z);

        let needsUpdate = false;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            // --- 1. Entrance Animation ---
            let scale = 0;
            // Advance progress if delay passed
            // Using time is tricky if we reset, but let's assume component mounts once.
            // Better: just increment progress based on delta.
            if (time > 0.3 + entranceDelays.current[i]) { // 0.3s initial delay
                // Lerp progress to 1
                entranceProgress.current[i] = THREE.MathUtils.lerp(entranceProgress.current[i], 1, delta * 3);
            }

            // Elastic-ish ease out
            // standard lerp is ease-out cubic-ish
            const p = entranceProgress.current[i];
            const targetSize = voxelData.sizes[i];

            // Simple elastic overshoot effect: p * (1 + overshoot * (1 - p)) could work, 
            // but simple lerp to 1 is fine for now, let's add a bit of scale pulse if we want logic
            scale = targetSize * p;


            // --- 2. Physics / Turbulence ---
            tmpPos.set(
                originalPositions.current[idx],
                originalPositions.current[idx + 1],
                originalPositions.current[idx + 2]
            );

            const turbulenceScale = materialPreset === "liquid-glass" ? motionStrength * 0.75 : motionStrength;
            const turbulenceX = Math.sin(time * 0.22 + i * 0.1) * 0.045 * turbulenceScale;
            const turbulenceY = Math.cos(time * 0.18 + i * 0.15) * 0.07 * turbulenceScale;
            const turbulenceZ = Math.sin(time * 0.24 + i * 0.12) * 0.035 * turbulenceScale;

            tmpTarget.set(
                tmpPos.x + turbulenceX,
                tmpPos.y + turbulenceY,
                tmpPos.z + turbulenceZ
            );

            // Read current position
            tmpPos.set(
                currentPositions.current[idx],
                currentPositions.current[idx + 1],
                currentPositions.current[idx + 2]
            );

            // Read velocity
            tmpVelocity.set(
                velocities.current[idx],
                velocities.current[idx + 1],
                velocities.current[idx + 2]
            );

            // Antigravity repulsion
            tmpRepulsion.copy(tmpPos).sub(tmpMouse);
            const dist = tmpRepulsion.length();

            if (dist < repulsionRadius && dist > 0.01) {
                const force = (1 - dist / repulsionRadius) * repulsionStrength;
                // Normalize and scale
                tmpRepulsion.multiplyScalar((force * 0.3) / dist);
                tmpVelocity.add(tmpRepulsion);
            }

            // Spring back
            tmpTarget.sub(tmpPos).multiplyScalar(materialPreset === "liquid-glass" ? 0.018 : 0.02);
            tmpVelocity.add(tmpTarget);

            // Damping
            tmpVelocity.multiplyScalar(materialPreset === "liquid-glass" ? 0.94 : 0.92);

            // Apply
            tmpPos.add(tmpVelocity);

            // Store back
            currentPositions.current[idx] = tmpPos.x;
            currentPositions.current[idx + 1] = tmpPos.y;
            currentPositions.current[idx + 2] = tmpPos.z;

            velocities.current[idx] = tmpVelocity.x;
            velocities.current[idx + 1] = tmpVelocity.y;
            velocities.current[idx + 2] = tmpVelocity.z;

            // --- 3. Update Matrix ---
            dummyObject.position.copy(tmpPos);
            dummyObject.scale.setScalar(scale);

            // Rotation
            dummyObject.rotation.x = tmpVelocity.y * (materialPreset === "liquid-glass" ? 1.2 : 2);
            dummyObject.rotation.y = tmpVelocity.x * (materialPreset === "liquid-glass" ? 1.2 : 2);
            dummyObject.rotation.z = 0;

            dummyObject.updateMatrix();
            mesh.setMatrixAt(i, dummyObject.matrix);
            needsUpdate = true;
        }

        if (needsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, count]}
            frustumCulled={false}
        >
            <boxGeometry args={[1, 1, 1]} />
            {materialPreset === "liquid-glass" ? (
                <meshPhysicalMaterial
                    transparent
                    opacity={0.34}
                    depthWrite={false}
                    roughness={0.08}
                    metalness={0.02}
                    transmission={0.92}
                    thickness={1.35}
                    ior={1.12}
                    reflectivity={1}
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0.12}
                    attenuationColor="#d7d7d7"
                    attenuationDistance={5}
                />
            ) : (
                <meshStandardMaterial
                    transparent
                    opacity={0.6}
                    roughness={0.2}
                    metalness={0.15}
                    envMapIntensity={0.6}
                />
            )}
        </instancedMesh>
    );
}
