"use client";

import { useRef, useEffect, useState } from "react";

interface DitherBackgroundProps {
    className?: string;
    intensity?: number;
    children?: React.ReactNode;
}

export function DitherBackground({
    className,
    children,
}: DitherBackgroundProps) {
    return (
        <div className={`relative ${className}`}>
            {children}
        </div>
    );
}
