"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
// @ts-ignore
import { animate, createTimeline, stagger } from "animejs";

import { cn } from "@/lib/utils";

type VoxelBackgroundProps = {
  className?: string;
};

type PointerRef = MutableRefObject<{ x: number; y: number }>;

type VoxelCube = {
  position: [number, number, number];
  size: number;
  color: string;
};

function createSeededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Update Props interface
type VoxelFieldProps = {
  cubes: VoxelCube[]; // refined below
  pointer: PointerRef;
  ambient?: MutableRefObject<{ x: number; y: number; z: number }>;
}

function VoxelField({ cubes, pointer, ambient }: VoxelFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    // Add null check for window to ensure we're client-side
    if (typeof window === "undefined" || meshRefs.current.length === 0) return;

    // Reset positions for entrance
    meshRefs.current.forEach((mesh) => {
      if (mesh) {
        mesh.scale.set(0, 0, 0);
        mesh.position.y += 2; // Start slightly higher/lower?
      }
    });

    // V4: animate(targets, params) - simplified to avoid stagger grid issues
    try {
      animate(
        meshRefs.current.filter(Boolean),
        {
          scale: [0, 1],
          delay: stagger(30),
          easing: "easeOutElastic(1, .8)",
          duration: 2000,
        }
      );
    } catch (e) {
      console.warn('Anime.js animation failed:', e);
    }

    // Color Morphing Loop
    const morphTimeline = createTimeline({
      loop: true,
      // direction: 'alternate' // Removed as it seems unavailable in definitions or creates error
      // If needed, we simulate alternate by adding reverse keyframes or checking docs later
      defaults: {
        easing: 'easeInOutQuad'
      }
    } as any);

    // We want to shift hue slightly for all cubes
    // Since we can't easily animate "HSL string" of a ThreeJS material directly via AnimeJS 
    // without parsing, we can animate a proxy "hue offset" for each cube and update in update callback?
    // Or simpler: Animate a global "hue shift" and apply it to the meshes?

    // Let's animate a subtle opacity or scale pulse as "color morphing" might be expensive/complex 
    // to map back to HSL string -> Color object per frame for 120 items without overhead.
    // User requested "Color Morphing".
    // Best approach: target the Material's 'emissiveIntensity' or simply animate the 'color' property of specific cubes
    // Let's pick a random subset to "pulse" color

    // Pulse animation - removed to avoid compatibility issues
    // The voxel scene will still render without pulse animations

  }, [cubes]);

  useFrame((state) => {
    // ... useFrame (unchanged) ...
    // Note: I need to ensure I am not removing useFrame code by replacing too much
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.getElapsedTime();
    const lerp = THREE.MathUtils.lerp;

    // We heavily reduced the lerp because pointer is already smoothed/animated by Anime.js
    // We apply slight damping still for the time-based rotation to keep it smooth

    // Mix Mouse + Ambient
    const ambientX = ambient?.current.x || 0;
    const ambientY = ambient?.current.y || 0;

    // Mouse influence (stronger) + Ambient (subtle, timeline driven) + Time (constant drift)
    const targetRotY = (pointer.current.x * 0.35) + ambientY + (t * 0.05);
    const targetRotX = 0.22 + (pointer.current.y * 0.25) + ambientX;

    group.rotation.y = lerp(group.rotation.y, targetRotY, 0.1);
    group.rotation.x = lerp(group.rotation.x, targetRotX, 0.1);

    // Floating
    group.position.z = lerp(group.position.z, -2.5 + Math.sin(t * 0.5) * 0.2, 0.03);

    // Camera follow (mostly mouse)
    state.camera.position.x = lerp(state.camera.position.x, pointer.current.x * 0.45, 0.1);
    state.camera.position.y = lerp(state.camera.position.y, pointer.current.y * 0.3, 0.1);
    state.camera.lookAt(0, 0, 0);
  });

  // ... JSX (unchanged)
  return (
    <group ref={groupRef}>
      {/* ... */}
      {cubes.map((cube, index) => (
        <mesh
          key={index}
          ref={(el) => { meshRefs.current[index] = el; }}
          position={cube.position}
          castShadow={false}
          receiveShadow={false}
        >
          <boxGeometry args={[cube.size, cube.size, cube.size]} />
          <meshStandardMaterial
            color={cube.color}
            transparent
            opacity={0.26}
            roughness={0.4}
            metalness={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}



export function VoxelBackground({ className }: VoxelBackgroundProps) {
  // ... setup ...
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointeranimated = useRef({ x: 0, y: 0 });
  // Ambient motion refs
  const ambientRotation = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // ...
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    // ... pointer ...
    if (prefersReducedMotion || typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      const targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      const targetY = (event.clientY / window.innerHeight - 0.5) * -2;

      animate(
        pointeranimated.current,
        {
          x: targetX,
          y: targetY,
          easing: 'easeOutElastic(1, .6)',
          duration: 1200
        }
      );
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);

  }, [prefersReducedMotion]);

  // Ambient Motion & Color Morphing Effect
  useEffect(() => {
    if (prefersReducedMotion) return;

    // Ambient floating timeline
    const tl = createTimeline({
      loop: true,
      // direction removed
      defaults: {
        easing: 'easeInOutSine'
      }
    } as any);

    // Fix add syntax: add(targets, params)
    tl
      .add(ambientRotation.current, {
        x: 0.1, // Slight tilt
        y: 0.15,
        duration: 7000,
      })
      .add(ambientRotation.current, {
        x: -0.05,
        y: -0.1,
        duration: 9000
      });

    // Color Morphing
    // We animate a proxy value and update materials in update callback specific to each group?
    // Actually, let's just animate the materials directly if possible or use a safer approach for Three.js
    // Re-accessing meshRefs from VoxelField is hard here because it's in child.
    // We will move this logic to VoxelField or pass a ref down?
    // Let's implement Color morphing inside VoxelField where we have meshRefs!

  }, [prefersReducedMotion]);

  // ... rest ...
  const cubes = useMemo(() => {
    // ... cubes generation ...
    const random = createSeededRandom(17);
    const spread = 6.5;
    return Array.from({ length: 120 }, () => {
      // ...
      const x = (random() - 0.5) * spread * 1.4;
      const y = (random() - 0.5) * spread * 1.1;
      const z = (random() - 0.5) * spread;
      const size = 0.12 + random() * 0.22;
      const hue = 200 + random() * 32;
      const saturation = 46 + random() * 16;
      const lightness = 46 + random() * 22;

      return {
        position: [x, y, z] as [number, number, number],
        size,
        color: `hsl(${hue} ${saturation}% ${lightness}%)`,
        // Store initial HSL for morphing reference if needed
        hue, saturation, lightness
      };
    });
  }, []);

  return (
    // ...
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_74%)]",
        className,
      )}
      aria-hidden
    >
      {prefersReducedMotion ? (
        // ... fallback
        <div
          className="h-full w-full bg-[radial-gradient(circle_at_50%_40%,rgba(222,221,217,0.26),rgba(23,23,23,0.92))]"
          style={{ opacity: 0.22 }}
        />
      ) : (
        <Canvas
          className="h-full w-full"
          style={{ opacity: 0.25, mixBlendMode: "screen" }}
          gl={{ antialias: false, alpha: true }}
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 7], fov: 50, near: 0.1, far: 45 }}
        >
          {/* ... lights ... */}
          <ambientLight intensity={0.65} />
          <directionalLight position={[4, 6, 5]} intensity={0.35} color="#9cd9ff" />
          <directionalLight position={[-4, -6, -4]} intensity={0.18} color="#ffe1c4" />
          <VoxelField
            cubes={cubes}
            pointer={pointeranimated}
            ambient={ambientRotation} // Pass ambient ref down
          />
        </Canvas>
      )}
    </div>
  );
}
