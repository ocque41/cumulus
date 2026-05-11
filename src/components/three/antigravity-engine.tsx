"use client";

import { useRef, useCallback, useEffect, type MutableRefObject } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animate, createSpring } from "animejs";

export interface AntigravityConfig {
    /** Strength of the repulsion force (0-1) */
    repulsionStrength: number;
    /** Radius of the repulsion effect in world units */
    repulsionRadius: number;
    /** Friction/damping for the effect (0-1) */
    friction: number;
    /** Whether the effect is enabled */
    enabled?: boolean;
}

export interface AntigravityState {
    /** Current mouse position in normalized device coordinates (-1 to 1) */
    mouse: THREE.Vector2;
    /** Current mouse position in 3D world space */
    mouseWorld: THREE.Vector3;
    /** Raycaster for mouse-to-3D conversion */
    raycaster: THREE.Raycaster;
    /** Plane for raycasting (at z=0) */
    plane: THREE.Plane;
    /** Animated mouse position (smoothed with Anime.js spring) */
    animatedMouse: MutableRefObject<{ x: number; y: number; z: number }>;
}

const defaultConfig: AntigravityConfig = {
    repulsionStrength: 0.5,
    repulsionRadius: 2.0,
    friction: 0.85,
    enabled: true,
};

/**
 * Hook that provides Antigravity physics for React Three Fiber scenes.
 * 
 * Features:
 * - Raycasts mouse position into 3D world space
 * - Provides smooth, spring-animated mouse position via Anime.js
 * - Calculates repulsion forces for objects near the cursor
 */
export function useAntigravity(
    config: Partial<AntigravityConfig> = {}
): AntigravityState {
    const { repulsionStrength, repulsionRadius, friction, enabled } = {
        ...defaultConfig,
        ...config,
    };

    const { camera, size } = useThree();

    // Refs for state that doesn't need re-renders
    const mouse = useRef(new THREE.Vector2());
    const mouseWorld = useRef(new THREE.Vector3());
    const raycaster = useRef(new THREE.Raycaster());
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
    const animatedMouse = useRef({ x: 0, y: 0, z: 0 });
    const targetMouse = useRef({ x: 0, y: 0, z: 0 });

    // Handle pointer movement
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return;

        const handlePointerMove = (event: PointerEvent) => {
            // Convert to normalized device coordinates (-1 to 1)
            const x = (event.clientX / size.width) * 2 - 1;
            const y = -(event.clientY / size.height) * 2 + 1;

            mouse.current.set(x, y);

            // Raycast to find 3D position
            raycaster.current.setFromCamera(mouse.current, camera);
            const intersection = new THREE.Vector3();
            raycaster.current.ray.intersectPlane(plane.current, intersection);
            mouseWorld.current.copy(intersection);

            // Update target for Anime.js animation
            targetMouse.current.x = intersection.x;
            targetMouse.current.y = intersection.y;
            targetMouse.current.z = intersection.z;

            // Animate with spring physics
            animate(animatedMouse.current, {
                x: intersection.x,
                y: intersection.y,
                z: intersection.z,
                duration: 800,
                easing: "easeOutElastic(1, .6)",
            });
        };

        const handlePointerLeave = () => {
            // Return to center with spring
            animate(animatedMouse.current, {
                x: 0,
                y: 0,
                z: 0,
                ease: createSpring({ stiffness: 200, damping: 20 }),
            });
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerleave", handlePointerLeave);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerleave", handlePointerLeave);
        };
    }, [enabled, camera, size]);

    return {
        mouse: mouse.current,
        mouseWorld: mouseWorld.current,
        raycaster: raycaster.current,
        plane: plane.current,
        animatedMouse,
    };
}

/**
 * Calculate repulsion offset for a position based on mouse proximity.
 * Used with InstancedMesh to push instances away from cursor.
 */
export function calculateRepulsion(
    position: THREE.Vector3,
    mousePosition: THREE.Vector3,
    config: AntigravityConfig
): THREE.Vector3 {
    const { repulsionStrength, repulsionRadius, friction } = config;

    const direction = new THREE.Vector3().subVectors(position, mousePosition);
    const distance = direction.length();

    if (distance > repulsionRadius || distance < 0.001) {
        return new THREE.Vector3(0, 0, 0);
    }

    // Inverse distance falloff
    const force = (1 - distance / repulsionRadius) * repulsionStrength;

    direction.normalize().multiplyScalar(force * (1 - friction));

    return direction;
}

/**
 * Shader uniforms for GPU-based Antigravity calculations.
 * Pass these to custom ShaderMaterial for InstancedMesh.
 */
export function createAntigravityUniforms() {
    return {
        uMousePosition: { value: new THREE.Vector3(0, 0, 0) },
        uRepulsionStrength: { value: 0.5 },
        uRepulsionRadius: { value: 2.0 },
        uTime: { value: 0 },
    };
}

/**
 * Vertex shader chunk for Antigravity displacement.
 * Inject this into custom ShaderMaterial vertex shaders.
 */
export const antigravityVertexChunk = /* glsl */ `
  uniform vec3 uMousePosition;
  uniform float uRepulsionStrength;
  uniform float uRepulsionRadius;
  uniform float uTime;
  
  vec3 applyAntigravity(vec3 position, vec3 instancePosition) {
    vec3 worldPos = instancePosition + position;
    vec3 direction = worldPos - uMousePosition;
    float distance = length(direction);
    
    if (distance < uRepulsionRadius && distance > 0.001) {
      float force = (1.0 - distance / uRepulsionRadius) * uRepulsionStrength;
      vec3 offset = normalize(direction) * force;
      return position + offset;
    }
    
    return position;
  }
`;
