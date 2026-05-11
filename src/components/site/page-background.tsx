"use client";

import { useEffect } from "react";

export function PageBackground({ color }: { color: string }) {
    useEffect(() => {
        // Override the CSS variable on the root element
        document.documentElement.style.setProperty("--bg", color);

        // Cleanup: remove the inline style to revert to the stylesheet definition
        return () => {
            document.documentElement.style.removeProperty("--bg");
        };
    }, [color]);

    return null;
}
