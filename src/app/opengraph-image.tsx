import { ImageResponse } from "next/og";

export const alt = "Cumulus Create — npm create @cmls@latest my-acme";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#f5f5f5";
const BG = "#1a1a1a";
const LINE = "rgba(245,245,245,0.18)";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px",
          background: BG,
          color: INK,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: INK, display: "flex" }} />
          Cumulus Create
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div
            style={{
              fontSize: 144,
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              maxWidth: 980,
              display: "flex",
            }}
          >
            Create a Cumulus app.
          </div>
          <div
            style={{
              display: "flex",
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              padding: "22px 28px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 34,
              color: "rgba(245,245,245,0.92)",
            }}
          >
            npm create @cmls@latest my-acme
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(245,245,245,0.64)",
          }}
        >
          <span>Templates</span>
          <span>Relay auth</span>
          <span>Cumulus DB</span>
          <span>Knowledge</span>
        </div>
      </div>
    ),
    size,
  );
}
