import { useId } from "react";

interface DitherCloudMarkProps {
  className?: string;
  decorative?: boolean;
  title?: string;
}

const CLOUD_PATH =
  "M35 77H124C140 77 151 66 151 52C151 39 141 29 128 28C123 15 111 7 97 7C82 7 69 16 64 30C59 26 52 24 45 24C30 24 18 35 17 50C9 53 4 61 6 68C8 74 19 77 35 77Z";

export function DitherCloudMark({
  className = "",
  decorative = false,
  title = "Cumulus dither cloud",
}: DitherCloudMarkProps) {
  const patternId = `cloud-dither-${useId().replaceAll(":", "")}`;
  const maskId = `cloud-mask-${useId().replaceAll(":", "")}`;
  const titleId = `cloud-title-${useId().replaceAll(":", "")}`;

  return (
    <svg
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : titleId}
      className={`dither-cloud-mark ${className}`.trim()}
      data-slot="dither-cloud"
      focusable="false"
      role={decorative ? undefined : "img"}
      viewBox="0 0 160 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      {decorative ? null : <title id={titleId}>{title}</title>}
      <defs>
        <pattern height="7" id={patternId} patternUnits="userSpaceOnUse" width="7">
          <circle cx="1.2" cy="1.2" fill="currentColor" r="1.15" />
          <circle cx="4.8" cy="4.8" fill="currentColor" opacity="0.58" r="0.65" />
        </pattern>
        <mask id={maskId}>
          <rect fill="black" height="96" width="160" />
          <path d={CLOUD_PATH} fill="white" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <rect fill={`url(#${patternId})`} height="96" width="160" />
        <path
          d="M13 58H148M22 45H142M34 32H130M28 70H137"
          fill="none"
          opacity="0.22"
          stroke="currentColor"
          strokeWidth="0.8"
        />
      </g>
      <path className="dither-cloud-mark__signal" d={CLOUD_PATH} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
