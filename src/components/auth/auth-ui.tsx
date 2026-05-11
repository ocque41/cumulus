"use client";

import React, { useState, useEffect, useRef } from "react";

// --- BackgroundGrid Component ---
export const BackgroundGrid = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        // Nodes
        const points: { x: number, y: number, vx: number, vy: number }[] = [];
        const numPoints = Math.floor((w * h) / 15000); // Density based on screen size

        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5
            });
        }

        let aId: number;

        const render = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ffffff';

            // Update and draw points
            points.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                // Draw dot
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Connect nearby points
                for (let j = i + 1; j < points.length; j++) {
                    const p2 = points[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.globalAlpha = 0.05 * (1 - dist / 120);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            aId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            if (!canvas) return;
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(aId);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-40" />;
}

// --- HyperInput Component ---
export const HyperInput = ({
    icon: Icon,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: any }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div className="relative group">
            <div className={`absolute inset-0 bg-white/5 rounded-[5px] border transition-colors duration-300 ${focused ? "border-white/40" : "border-white/10"}`} />

            {/* Scanning line effect on focus */}
            <div className={`absolute bottom-0 left-0 h-[1px] bg-[#E5E4E2] shadow-[0_0_10px_#E5E4E2] transition-all duration-500 ${focused ? "w-full opacity-100" : "w-0 opacity-0"}`} />

            <div className="relative flex items-center px-4 py-3">
                <Icon className={`w-5 h-5 mr-3 transition-colors duration-300 ${focused ? "text-[#E5E4E2]" : "text-white/40"}`} />
                <input
                    {...props}
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/20 font-mono text-sm"
                />
            </div>
        </div>
    );
};
