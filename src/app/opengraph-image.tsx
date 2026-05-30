import { ImageResponse } from "next/og";

import { CUMULUS } from "@/lib/brand/tokens";

export const alt = "Cumulus social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const c = CUMULUS.color;
const ink = "#050505";

function Box({
  x,
  y,
  w,
  h,
  color,
  opacity = 1,
  border,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  opacity?: number;
  border?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity,
        ...(color ? { background: color } : {}),
        ...(border ? { border } : {}),
      }}
    />
  );
}

function PatternField() {
  const rowText = ". .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .  . .";
  const rows = Array.from({ length: 24 }, (_, index) => {
    const y = 14 + index * 22;
    const alpha = y > 390 ? 0.05 : 0.12;

    return (
      <div
        key={`pattern-${index}`}
        style={{
          position: "absolute",
          left: index % 2 === 0 ? 14 : 42,
          top: y,
          color: c.paper,
          fontFamily: "monospace",
          fontSize: 16,
          letterSpacing: 3,
          lineHeight: "16px",
          opacity: alpha,
          whiteSpace: "nowrap",
        }}
      >
        {rowText}
      </div>
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {rows}
    </div>
  );
}

function PixelRidges() {
  const ridges: Array<{ x: number; y: number; widths: number[]; color: string }> = [
    { x: 0, y: 506, widths: [140, 165, 120, 88], color: c.paper },
    { x: 250, y: 492, widths: [245, 290, 340, 260, 188], color: c.paper },
    { x: 690, y: 528, widths: [148, 198, 140, 96], color: c.paper },
    { x: 930, y: 494, widths: [270, 270, 270, 220, 180], color: c.paper },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", opacity: 0.18 }}>
      {ridges.flatMap((ridge) =>
        ridge.widths.map((width, index) => (
          <Box key={`${ridge.x}-${ridge.y}-${index}`} x={ridge.x} y={ridge.y + index * 17} w={width} h={4} color={ridge.color} />
        )),
      )}
    </div>
  );
}

function PixelShrubs() {
  const shrubs = Array.from({ length: 120 }, (_, index) => {
    const x = (index * 73) % 1190;
    const y = 498 + ((index * 19) % 92);
    const tone = c.paper;
    const alpha = index % 5 === 0 ? 0.32 : 0.18;

    return (
      <div key={`shrub-${index}`} style={{ position: "absolute", left: x, top: y, display: "flex", width: 18, height: 24, opacity: alpha }}>
        <Box x={0} y={0} w={4} h={4} color={tone} />
        <Box x={6} y={-6} w={4} h={4} color={tone} />
        <Box x={12} y={0} w={4} h={4} color={tone} />
        <Box x={6} y={6} w={4} h={14} color={tone} />
      </div>
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {shrubs}
    </div>
  );
}

function PixelAppScene() {
  return (
    <div style={{ position: "absolute", left: 610, top: 128, display: "flex", width: 460, height: 360 }}>
      <Box x={26} y={218} w={336} h={108} border={`4px solid ${c.paper}`} opacity={0.72} />
      <Box x={54} y={244} w={82} h={56} border={`4px solid ${c.paper}`} opacity={0.8} />
      <Box x={158} y={244} w={82} h={56} border={`4px solid ${c.paper}`} opacity={0.42} />
      <Box x={262} y={244} w={72} h={56} border={`4px solid ${c.paper}`} opacity={0.6} />
      <Box x={78} y={210} w={230} h={10} color={c.paper} opacity={0.44} />
      <Box x={106} y={194} w={178} h={10} color={c.paper} opacity={0.28} />

      <Box x={92} y={84} w={218} h={110} border={`4px solid ${c.paper}`} opacity={0.5} />
      <Box x={122} y={112} w={30} h={30} border={`4px solid ${c.paper}`} opacity={0.8} />
      <Box x={178} y={112} w={30} h={30} border={`4px solid ${c.paper}`} opacity={0.52} />
      <Box x={234} y={112} w={30} h={30} border={`4px solid ${c.paper}`} opacity={0.68} />
      <Box x={122} y={158} w={142} h={8} color={c.paper} opacity={0.24} />
      <Box x={122} y={176} w={92} h={8} color={c.paper} opacity={0.16} />

      <Box x={158} y={34} w={88} h={36} border={`4px solid ${c.paper}`} opacity={0.62} />
      <Box x={182} y={10} w={42} h={24} color={c.paper} opacity={0.3} />

      <Box x={190} y={70} w={4} h={32} color={c.paper} opacity={0.5} />
      <Box x={190} y={194} w={4} h={24} color={c.paper} opacity={0.5} />
      <Box x={12} y={270} w={60} h={4} color={c.paper} opacity={0.26} />
      <Box x={342} y={270} w={92} h={4} color={c.paper} opacity={0.26} />
      <Box x={430} y={224} w={4} h={50} color={c.paper} opacity={0.18} />
      <Box x={430} y={224} w={34} h={4} color={c.paper} opacity={0.18} />

      {Array.from({ length: 44 }, (_, index) => {
        const x = 10 + ((index * 37) % 410);
        const y = 20 + ((index * 53) % 305);
        const alpha = index % 4 === 0 ? 0.38 : 0.18;
        return <Box key={`node-${index}`} x={x} y={y} w={6} h={6} color={c.paper} opacity={alpha} />;
      })}

      {Array.from({ length: 22 }, (_, index) => {
        const x = 36 + ((index * 61) % 360);
        const y = 52 + ((index * 41) % 244);
        return <Box key={`trace-${index}`} x={x} y={y} w={index % 2 === 0 ? 42 : 4} h={4} color={c.paper} opacity={0.12} />;
      })}
    </div>
  );
}

function Scene() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      <PatternField />
      <Box x={0} y={420} w={1200} h={210} color={c.paper} opacity={0.01} />
      <Box x={0} y={458} w={1200} h={172} color={c.paper} opacity={0.014} />
      <PixelRidges />
      <PixelShrubs />
      <PixelAppScene />
      <Box x={44} y={548} w={292} h={4} color={c.paper} opacity={0.32} />
      <Box x={44} y={562} w={224} h={4} color={c.paper} opacity={0.16} />
      <Box x={930} y={102} w={212} h={4} color={c.paper} opacity={0.22} />
      <Box x={1006} y={116} w={136} h={4} color={c.paper} opacity={0.12} />
    </div>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: ink,
          color: c.paper,
          fontFamily: "sans-serif",
        }}
      >
        <Scene />

        <div
          style={{
            position: "absolute",
            left: 58,
            top: 62,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            width: 510,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18, lineHeight: "24px", letterSpacing: 0, color: c.paper2 }}>Cumulus</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 70, lineHeight: "70px", fontWeight: 300, letterSpacing: 0 }}>
              One command to a deployable agentic app.
            </div>
            <div style={{ fontSize: 25, lineHeight: "34px", color: c.paper2, letterSpacing: 0 }}>
              A ready-to-deploy agentic Cumulus app, shaped by the parts you choose.
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 58,
            bottom: 46,
            display: "flex",
            alignItems: "center",
            gap: 16,
            border: `1px solid ${c.paperHair}`,
            padding: "14px 18px",
            background: ink,
            color: c.paper,
            fontSize: 22,
            lineHeight: "28px",
            letterSpacing: 0,
          }}
        >
          <span>npm create @cmls@latest</span>
          <span style={{ color: c.paper2 }}>@cmls/create</span>
        </div>
      </div>
    ),
    size,
  );
}
