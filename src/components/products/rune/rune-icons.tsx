/**
 * Rune Icons - Minimal SVG icons for the Rune section
 * 
 * Aesthetic, minimal line icons that replace emojis.
 * Uses currentColor for easy theming.
 */

import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaultProps: IconProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

// Shopping cart icon
export function CartIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}

// Credit card / payment icon
export function PaymentIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    );
}

// Chat / message icon
export function ChatIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

// Mail / envelope icon
export function MailIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}

// Package / box icon
export function PackageIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <path d="M16.5 9.4l-9-5.19" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
}

// User / person icon
export function UserIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

// Chart / analytics icon
export function ChartIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}

// Shuffle / routing icon
export function RouteIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
    );
}

// Star icon
export function StarIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

// Gift icon
export function GiftIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
    );
}

// Zap / lightning icon (for triggers)
export function ZapIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

// Activity / pulse icon
export function ActivityIcon(props: IconProps) {
    return (
        <svg {...defaultProps} {...props}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
}
