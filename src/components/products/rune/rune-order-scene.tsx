"use client";

/**
 * RuneOrderScene - Scene 1: Order Entry
 * 
 * Shows a glowing order orb sliding into the hub,
 * representing a new customer order entering the system.
 * 
 * Animation:
 * - Order orb slides in from off-screen with scale
 * - Caption fades in alongside
 */

export function RuneOrderScene() {
    return (
        <div data-rune-scene="order" className="absolute inset-0 pointer-events-none">
            {/* Order Orb */}
            <div
                className="rune-order"
                data-rune-order
                style={{
                    top: "40%",
                    left: "20%",
                    opacity: 0,
                }}
            >
                <div className="rune-order-inner" />
            </div>

            {/* Caption */}
            <div
                className="rune-caption"
                data-rune-caption="order"
                style={{ opacity: 0 }}
            >
                <h4 className="rune-caption-title">
                    Order Enters the System
                </h4>
                <p className="rune-caption-text">
                    New order from VIP customer enters Rune.
                    Automation begins instantly.
                </p>
            </div>
        </div>
    );
}
