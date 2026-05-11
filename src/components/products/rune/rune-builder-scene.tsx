"use client";

/**
 * RuneBuilderScene - Scene 5: Build Your Own Flow
 * 
 * A workflow builder mockup showing drag-and-drop style nodes
 * connected by cables, with the final CTA.
 * 
 * Animation:
 * - Blocks slide in staggered diagonal pattern
 * - Connections grow between blocks
 * - CTA appears with shimmer effect
 */

// Workflow blocks for the builder mockup
const WORKFLOW_BLOCKS = [
    { id: "trigger", label: "New order arrives", icon: "🛒" },
    { id: "condition", label: "Check VIP status", icon: "⭐" },
    { id: "notify", label: "Send Slack alert", icon: "💬" },
    { id: "discount", label: "Issue discount code", icon: "🎁" },
];

export function RuneBuilderScene() {
    return (
        <div data-rune-scene="builder" className="absolute inset-0 pointer-events-none">
            {/* Workflow Builder Mockup */}
            <div className="rune-builder" style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(400px, 90vw)",
            }}>
                {WORKFLOW_BLOCKS.map((block, index) => (
                    <div key={block.id} style={{ position: "relative" }}>
                        {/* Connection line to previous block */}
                        {index > 0 && (
                            <div
                                className="rune-connection"
                                data-rune-connection
                                style={{
                                    top: "-1.5rem",
                                    opacity: 0,
                                    transform: "scaleX(0)",
                                }}
                            />
                        )}

                        {/* Block */}
                        <div
                            className="rune-block"
                            data-rune-block
                            style={{ opacity: 0 }}
                        >
                            <span className="rune-block-icon" aria-hidden="true">
                                {block.icon}
                            </span>
                            {block.label}
                        </div>
                    </div>
                ))}

                {/* CTA */}
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                    <button
                        className="rune-cta"
                        data-rune-cta
                        style={{ opacity: 0, pointerEvents: "auto" }}
                    >
                        Build Your Automation
                    </button>
                    <p
                        style={{
                            marginTop: "0.75rem",
                            fontFamily: '"Anonymous Pro", monospace',
                            fontSize: "0.75rem",
                            color: "var(--subtitle, #999)",
                            opacity: 0,
                        }}
                        data-rune-cta-subtext
                    >
                        No code required • Deploy in minutes
                    </p>
                </div>
            </div>

            {/* Caption */}
            <div
                className="rune-caption"
                data-rune-caption="builder"
                style={{
                    opacity: 0,
                    bottom: "10%",
                }}
            >
                <h4 className="rune-caption-title">
                    Design Your Workflows
                </h4>
                <p className="rune-caption-text">
                    Build custom ecommerce automations with
                    our visual workflow builder.
                </p>
            </div>
        </div>
    );
}
