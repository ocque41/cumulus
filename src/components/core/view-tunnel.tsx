"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

/**
 * ViewTunnel - Simple React context-based portal system.
 * 
 * This is a fallback implementation that doesn't require tunnel-rat.
 * It uses React context to collect 3D content from child components
 * and render it in a global location.
 */

// Context for storing tunneled content
const ViewTunnelContext = createContext<{
    content: ReactNode[];
    addContent: (content: ReactNode) => void;
    removeContent: (content: ReactNode) => void;
}>({
    content: [],
    addContent: () => { },
    removeContent: () => { },
});

/**
 * Provider that wraps the application, enabling tunneling.
 */
export function ViewTunnelProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ReactNode[]>([]);

    const addContent = useCallback((newContent: ReactNode) => {
        setContent((prev) => [...prev, newContent]);
    }, []);

    const removeContent = useCallback((contentToRemove: ReactNode) => {
        setContent((prev) => prev.filter((c) => c !== contentToRemove));
    }, []);

    return (
        <ViewTunnelContext.Provider value={{ content, addContent, removeContent }}>
            {children}
        </ViewTunnelContext.Provider>
    );
}

/**
 * The "In" portal - place 3D content here from any page component.
 * Content placed here will render into the global Canvas.
 */
export function ViewTunnelIn({ children }: { children: ReactNode }) {
    const { addContent, removeContent } = useContext(ViewTunnelContext);

    // Register content to be tunneled
    useEffect(() => {
        addContent(children);
        return () => removeContent(children);
    }, [children, addContent, removeContent]);

    // Do not render children locally (they are meant for the tunnel target)
    return null;
}

/**
 * The "Out" portal - place this inside the global Canvas.
 * Renders all content sent through ViewTunnelIn.
 */
export function ViewTunnelOut() {
    const { content } = useContext(ViewTunnelContext);
    return <>{content}</>;
}

/**
 * Hook to access the tunnel context directly if needed.
 */
export function useViewTunnel() {
    return useContext(ViewTunnelContext);
}
