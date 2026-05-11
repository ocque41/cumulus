"use client";

/**
 * RuneProductSection - Main Rune Product Showcase
 * 
 * This section displays directly under AntigravityHero on the home page.
 * Uses anime.js for card entrance animations.
 * 
 * ARCHITECTURE:
 * - RuneCard: Futuristic card component for hub, routing, etc.
 * - RuneParallelSection: Integration node chips with stagger
 * - RuneLogsPanel: Terminal with log lines + KPI counters
 * - RuneBuilderCard: Workflow builder with CTA shimmer
 */

import { useReducedMotion, useBreakpoint } from "@/hooks";
import { RuneCard } from "./rune-card";
import { RuneParallelSection } from "./rune-parallel-section";
import { RuneLogsPanel } from "./rune-logs-panel";
import { RuneBuilderCard } from "./rune-builder-card";
import {
    CartIcon,
    RouteIcon,
    PaymentIcon,
    ChatIcon,
    MailIcon,
    PackageIcon,
    UserIcon,
    ChartIcon,
    StarIcon,
    GiftIcon,
} from "./rune-icons";
import "./rune-card-styles.css";

// Integration nodes for parallel execution - using React icons
const INTEGRATION_NODES = [
    { id: "stripe", icon: <PaymentIcon />, label: "Stripe" },
    { id: "slack", icon: <ChatIcon />, label: "Slack" },
    { id: "sendgrid", icon: <MailIcon />, label: "SendGrid" },
    { id: "inventory", icon: <PackageIcon />, label: "Inventory" },
    { id: "crm", icon: <UserIcon />, label: "CRM" },
    { id: "analytics", icon: <ChartIcon />, label: "Analytics" },
];

// Runtime logs
const SAMPLE_LOGS = [
    { time: "12:34:01", message: "Order #4921 received from checkout", type: "info" as const },
    { time: "12:34:01", message: "Customer identified: VIP tier", type: "success" as const },
    { time: "12:34:02", message: "Stripe charge initiated → $127.50", type: "info" as const },
    { time: "12:34:02", message: "Inventory reserved: SKU-8812", type: "info" as const },
    { time: "12:34:03", message: "SendGrid confirmation queued", type: "success" as const },
    { time: "12:34:03", message: "Slack alert fired #orders", type: "success" as const },
];

// KPIs
const SAMPLE_KPIS = [
    { label: "Avg Latency", value: 24, suffix: "ms" },
    { label: "Automated", value: 97, suffix: "%" },
    { label: "Escalations", value: 3, suffix: "%" },
];

// Builder workflow nodes - using React icons
const WORKFLOW_NODES = [
    { id: "trigger", icon: <CartIcon />, label: "New order" },
    { id: "check", icon: <StarIcon />, label: "VIP check" },
    { id: "notify", icon: <ChatIcon />, label: "Alert team" },
    { id: "discount", icon: <GiftIcon />, label: "Apply reward" },
];

interface RuneProductSectionProps {
    /** @deprecated No longer used */
    trackHeight?: number;
    className?: string;
}

export function RuneProductSection({
    className = "",
}: RuneProductSectionProps) {
    const prefersReducedMotion = useReducedMotion();
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === "mobile";

    return (
        <section
            className={`rune-product-section ${className}`}
            aria-label="Rune Product Showcase"
        >
            {/* Content Layer */}
            <div className="rune-content-layer">
                {/* Section Header */}
                <header className="rune-header">
                    <span className="rune-badge">THE AUTOMATION ENGINE</span>
                    <h2 className="rune-main-title">
                        Rune
                    </h2>
                    <p className="rune-lead">
                        Watch a single order flow through an entire automated ecosystem.
                    </p>
                </header>

                {/* Scene 1: Boutique Order Hub */}
                <RuneCard
                    variant="hero"
                    title="Boutique Order Hub"
                    subtitle="Every customer order flows through a centralized hub with real-time visibility."
                    status="Order #4921"
                    statusType="vip"
                    icon={<CartIcon />}
                    reducedMotion={prefersReducedMotion}
                    delay={0}
                >
                    <div className="rune-hub-visual">
                        <div className="rune-hub-orb">
                            <span className="rune-hub-orb-inner" />
                        </div>
                        <p className="rune-hub-caption">VIP Customer • $127.50 • 3 items</p>
                    </div>
                </RuneCard>

                {/* Scene 2: Intelligent Routing */}
                <RuneCard
                    variant="routing"
                    title="Intelligent Routing"
                    subtitle="Rune analyzes each order and routes it to the right integrations automatically."
                    status="Live"
                    statusType="live"
                    icon={<RouteIcon />}
                    reducedMotion={prefersReducedMotion}
                    delay={100}
                >
                    <div className="rune-routing-visual">
                        <div className="rune-routing-paths">
                            <div className="rune-routing-path rune-routing-path--1" />
                            <div className="rune-routing-path rune-routing-path--2" />
                            <div className="rune-routing-path rune-routing-path--3" />
                        </div>
                    </div>
                </RuneCard>

                {/* Scene 3: Parallel Execution */}
                <RuneParallelSection
                    nodes={INTEGRATION_NODES}
                    reducedMotion={prefersReducedMotion}
                />

                {/* Scene 4: Runtime Logs + KPIs */}
                <RuneLogsPanel
                    logs={SAMPLE_LOGS}
                    kpis={SAMPLE_KPIS}
                    reducedMotion={prefersReducedMotion}
                />

                {/* Scene 5: Workflow Builder + CTA */}
                <RuneBuilderCard
                    nodes={WORKFLOW_NODES}
                    reducedMotion={prefersReducedMotion}
                />
            </div>
        </section>
    );
}
