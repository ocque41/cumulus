"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ShellContextType {
    isNavOpen: boolean;
    toggleNav: () => void;
    // We can add more global shell state here later (e.g., active module)
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export const ShellProvider = ({ children }: { children: ReactNode }) => {
    const [isNavOpen, setIsNavOpen] = useState(false);

    const toggleNav = () => setIsNavOpen(prev => !prev);

    return (
        <ShellContext.Provider value={{ isNavOpen, toggleNav }}>
            {children}
        </ShellContext.Provider>
    );
};

export const useShell = () => {
    const context = useContext(ShellContext);
    if (context === undefined) {
        throw new Error('useShell must be used within a ShellProvider');
    }
    return context;
};
