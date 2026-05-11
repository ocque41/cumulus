import { ImageResponse } from "next/og";

export const alt =
  "Cumulus — Tools and infrastructure for people building with AI.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#f5f5f5";
const BG = "#1a1a1a";
const ACCENT = "#a44718";

export default async function OpengraphImage() {
  const divider = (
    <span style={{ color: "rgba(245,245,245,0.22)", margin: "0 14px" }}>·</span>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: BG,
          color: INK,
          position: "relative",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -180,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background: `radial-gradient(circle at center, ${ACCENT}33 0%, ${ACCENT}00 60%)`,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              border: "1px solid rgba(245,245,245,0.14)",
              borderRadius: 999,
              background: "rgba(245,245,245,0.04)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(245,245,245,0.82)",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: ACCENT,
                boxShadow: `0 0 16px ${ACCENT}cc`,
                display: "flex",
              }}
            />
            Cumulus — Studio
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            marginTop: -20,
          }}
        >
          <div
            style={{
              fontSize: 236,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: "-0.045em",
              color: INK,
              display: "flex",
            }}
          >
            Cumulus
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 46,
              lineHeight: 1.2,
              letterSpacing: "-0.012em",
              maxWidth: 960,
              color: "rgba(245,245,245,0.9)",
              fontWeight: 400,
            }}
          >
            <span>Tools and infrastructure for people building with AI.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "rgba(245,245,245,0.6)",
            letterSpacing: "0.04em",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span>Tado</span>
            {divider}
            <span>Relay</span>
          </div>
          <div
            style={{
              color: "rgba(245,245,245,0.85)",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            cumulush.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
