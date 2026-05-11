export type Tier = 'free' | 'pro' | 'enterprise';

export const TIER_LIMITS = {
    free: {
        projects: 1,
        analytics: 'basic',
        support: 'community',
    },
    pro: {
        projects: Infinity,
        analytics: 'advanced',
        support: 'priority',
    },
    enterprise: {
        projects: Infinity,
        analytics: 'advanced',
        support: 'dedicated',
    },
} as const;

export function getTierLimits(tier: Tier) {
    return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function checkLimit(tier: Tier, resource: keyof typeof TIER_LIMITS['free'], currentUsage: number): boolean {
    const limit = getTierLimits(tier)[resource];
    if (typeof limit === 'number') {
        return currentUsage < limit;
    }
    return true; // Non-numeric limits (features) are checked by presence, here we assume access if checked
}

export function hasFeature(tier: Tier, feature: string): boolean {
    // Implement specific feature checks if needed
    // For now, simpler checks are done in components
    return true;
}
