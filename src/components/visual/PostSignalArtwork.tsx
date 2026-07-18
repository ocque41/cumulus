import {
  useEffect,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { stableDitherSeed } from "@/components/visual/DitherArtwork";
import type { DitherVariant } from "@/content/post-types";

import "./PostSignalArtwork.css";

const SIGNAL_NEAR_VIEWPORT_MARGIN = "0px";
const SIGNAL_INTERSECTION_THRESHOLD = 0.1;
const CORNERS = ["top-left", "top-right", "bottom-right", "bottom-left"] as const;
const CORNER_MOTIFS = ["pulse", "bars", "orbit", "scan"] as const;

type Corner = (typeof CORNERS)[number];
type CornerMotif = (typeof CORNER_MOTIFS)[number];
type AnimeRuntime = typeof import("./post-signal-anime");

let animeRuntimePromise: Promise<AnimeRuntime> | undefined;

function loadAnimeRuntime(): Promise<AnimeRuntime> {
  animeRuntimePromise ??= import("./post-signal-anime")
    .catch((error: unknown) => {
      animeRuntimePromise = undefined;
      throw error;
    });
  return animeRuntimePromise;
}

interface PostSignalArtworkBaseProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children?: ReactNode;
  seed: string;
  variant: DitherVariant;
}

export type PostSignalArtworkProps = PostSignalArtworkBaseProps &
  (
    | { decorative: true; label?: never }
    | { decorative?: false; label: string }
  );

function range(length: number) {
  return Array.from({ length }, (_, index) => index);
}

function seededUnit(seed: number, salt: number) {
  return stableDitherSeed(`${seed}:${salt}`) / 4_294_967_295;
}

function cornerAssignments(seed: number): Array<{ corner: Corner; motif: CornerMotif }> {
  const offset = seed % CORNER_MOTIFS.length;
  const motifs = CORNER_MOTIFS.map(
    (_, index) => CORNER_MOTIFS[(index + offset) % CORNER_MOTIFS.length],
  );
  if ((seed >>> 3) % 2 === 1) motifs.reverse();
  return CORNERS.map((corner, index) => ({ corner, motif: motifs[index] }));
}

function CornerInstrument({ corner, motif }: { corner: Corner; motif: CornerMotif }) {
  return (
    <span
      aria-hidden="true"
      className="post-signal__corner"
      data-corner={corner}
      data-corner-motif={motif}
    >
      {motif === "pulse" ? (
        <>
          <i data-signal-motion="pulse" />
          <i data-signal-motion="pulse" />
          <i data-signal-motion="pulse" />
        </>
      ) : null}
      {motif === "bars" ? (
        <>
          {range(5).map((index) => (
            <i data-signal-motion="bar" key={index} />
          ))}
        </>
      ) : null}
      {motif === "orbit" ? (
        <i data-signal-motion="orbit"><b /></i>
      ) : null}
      {motif === "scan" ? (
        <><i /><b data-signal-motion="scan" /></>
      ) : null}
    </span>
  );
}

function BaseGrid({ columns = 12, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <g className="post-signal__grid">
      {range(columns + 1).map((index) => (
        <line key={`x-${index}`} x1={80 + index * (560 / columns)} x2={80 + index * (560 / columns)} y1="54" y2="306" />
      ))}
      {range(rows + 1).map((index) => (
        <line key={`y-${index}`} x1="80" x2="640" y1={54 + index * (252 / rows)} y2={54 + index * (252 / rows)} />
      ))}
    </g>
  );
}

function Nodes({ count, seed }: { count: number; seed: number }) {
  return (
    <g className="post-signal__nodes">
      {range(count).map((index) => (
        <circle
          cx={112 + seededUnit(seed, index * 2) * 496}
          cy={78 + seededUnit(seed, index * 2 + 1) * 204}
          data-signal-motion="node"
          key={index}
          r={index % 3 === 0 ? 4 : 2.5}
        />
      ))}
    </g>
  );
}

type SignalDiagramRenderer = (seed: number) => ReactNode;

const SIGNAL_DIAGRAMS = {
  "cloud-gate": (seed) => (
        <>
          <path className="post-signal__trace post-signal__trace--strong" d="M132 246V142h82c8-51 51-87 105-87 43 0 82 23 100 59 11-6 25-10 39-10 44 0 80 35 80 79v63" data-signal-motion="trace" />
          <path className="post-signal__trace" d="M176 246V168h368v78M252 168v78M344 168v78M436 168v78" data-signal-motion="trace" />
          <Nodes count={9} seed={seed} />
        </>
  ),
  "signal-window": () => (
        <>
          <rect className="post-signal__frame" height="214" width="430" x="145" y="73" />
          <rect className="post-signal__frame post-signal__frame--inner" height="150" width="318" x="201" y="105" />
          <path className="post-signal__trace" d="M164 235l55-66 48 27 65-78 55 95 48-54 72 58 51-79" data-signal-motion="trace" />
          <rect className="post-signal__sweep" data-signal-motion="scan" height="214" width="34" x="108" y="73" />
        </>
  ),
  "terminal-rain": (seed) => (
        <>
          {range(15).map((index) => {
            const height = 62 + seededUnit(seed, index) * 190;
            return <line className="post-signal__rain" data-signal-motion="float" key={index} x1={110 + index * 36} x2={110 + index * 36} y1={58 + (index % 4) * 12} y2={58 + height} />;
          })}
          <path className="post-signal__trace post-signal__trace--strong" d="M90 285h540" data-signal-motion="trace" />
          <Nodes count={12} seed={seed} />
        </>
  ),
  "archive-lines": () => (
        <>
          {range(9).map((index) => (
            <path className="post-signal__archive-line" d={`M${92 + index * 8} ${73 + index * 27}H${590 - index * 14}l38 12`} data-signal-motion="trace" key={index} />
          ))}
          <rect className="post-signal__sweep" data-signal-motion="scan" height="254" width="26" x="84" y="54" />
        </>
  ),
  "split-horizon": (seed) => (
        <>
          <path className="post-signal__trace post-signal__trace--strong" d="M78 178h170l70-87 82 174 66-87h176" data-signal-motion="trace" />
          <path className="post-signal__trace" d="M78 188h192l48 78 82-174 86 96h156" data-signal-motion="trace" />
          <line className="post-signal__axis" x1="78" x2="642" y1="183" y2="183" />
          <Nodes count={8} seed={seed} />
        </>
  ),
  "key-vault": () => (
        <>
          <g data-signal-motion="orbit">
            <circle className="post-signal__ring" cx="360" cy="180" r="122" />
            <circle className="post-signal__ring post-signal__ring--broken" cx="360" cy="180" r="84" />
            <circle className="post-signal__node" cx="360" cy="58" data-signal-motion="node" r="5" />
          </g>
          <path className="post-signal__vault" d="M327 171v-24c0-23 14-39 33-39s33 16 33 39v24h22v77H305v-77z" />
          <path className="post-signal__trace" d="M360 193v31" data-signal-motion="trace" />
        </>
  ),
  "paper-field": () => (
        <>
          {range(7).map((index) => (
            <rect className="post-signal__paper" data-signal-motion="float" height={190 - index * 8} key={index} width="270" x={106 + index * 47} y={68 + index * 8} />
          ))}
          <path className="post-signal__trace post-signal__trace--strong" d="M122 268h480" data-signal-motion="trace" />
        </>
  ),
  "local-orbit": (seed) => (
        <>
          <g data-signal-motion="orbit">
            <ellipse className="post-signal__ring" cx="360" cy="180" rx="226" ry="96" />
            <ellipse className="post-signal__ring post-signal__ring--broken" cx="360" cy="180" rx="148" ry="136" />
            <circle className="post-signal__node" cx="586" cy="180" data-signal-motion="node" r="6" />
            <circle className="post-signal__node" cx="360" cy="44" data-signal-motion="node" r="4" />
          </g>
          <circle className="post-signal__core" cx="360" cy="180" data-signal-motion="pulse" r="30" />
          <Nodes count={7} seed={seed} />
        </>
  ),
  "record-lattice": (seed) => (
        <>
          <BaseGrid columns={14} rows={7} />
          <path className="post-signal__trace post-signal__trace--strong" d="M80 264h92v-83h81v-54h88v95h91v-121h84v79h124" data-signal-motion="trace" />
          <Nodes count={14} seed={seed} />
        </>
  ),
  "release-bars": (seed) => (
        <>
          <line className="post-signal__axis" x1="82" x2="638" y1="285" y2="285" />
          {range(18).map((index) => (
            <rect className="post-signal__bar" data-signal-motion="bar" height={38 + seededUnit(seed, index) * 174} key={index} width="16" x={96 + index * 29} y={73} />
          ))}
          <path className="post-signal__trace post-signal__trace--strong" d="M82 239l71-31 69 12 71-89 70 44 70-68 70 92 70-34 65 14" data-signal-motion="trace" />
        </>
  ),
  "shared-notebook": () => (
        <>
          <path className="post-signal__notebook" d="M112 77h207c27 0 41 13 41 36v181c0-23-14-36-41-36H112zM608 77H401c-27 0-41 13-41 36v181c0-23 14-36 41-36h207z" />
          {range(5).map((index) => (
            <path className="post-signal__trace" d={`M145 ${118 + index * 28}h135M440 ${118 + index * 28}h135`} data-signal-motion="trace" key={index} />
          ))}
          <line className="post-signal__axis" x1="360" x2="360" y1="92" y2="286" />
        </>
  ),
  "event-river": (seed) => (
        <>
          {range(7).map((index) => (
            <path className="post-signal__river" d={`M62 ${76 + index * 34}C176 ${24 + index * 44},244 ${146 + index * 24},350 ${100 + index * 28}S536 ${70 + index * 37},658 ${112 + index * 26}`} data-signal-motion="trace" key={index} />
          ))}
          <Nodes count={11} seed={seed} />
        </>
  ),
  "handoff-map": (seed) => (
        <>
          <path className="post-signal__map" d="M112 256L214 109l118 89 91-128 164 169M214 109l209-39M332 198l255 41" data-signal-motion="trace" />
          {[[112, 256], [214, 109], [332, 198], [423, 70], [587, 239]].map(([cx, cy], index) => (
            <g data-signal-motion="node" key={index}><circle className="post-signal__node" cx={cx} cy={cy} r="9" /><circle className="post-signal__node-core" cx={cx} cy={cy} r="3" /></g>
          ))}
          <Nodes count={6} seed={seed} />
        </>
  ),
  "compact-grid": () => (
        <>
          {range(40).map((index) => (
            <rect className="post-signal__cell" data-signal-motion={index % 5 === 0 ? "pulse" : undefined} height="34" key={index} width="45" x={102 + (index % 8) * 66} y={72 + Math.floor(index / 8) * 49} />
          ))}
          <rect className="post-signal__sweep" data-signal-motion="scan" height="250" width="22" x="80" y="56" />
        </>
  ),
  "plan-stack": () => (
        <>
          {range(6).map((index) => (
            <path className="post-signal__plan" d={`M${128 + index * 28} ${264 - index * 30}l178-142 284 14-172 142z`} data-signal-motion="float" key={index} />
          ))}
          <path className="post-signal__trace post-signal__trace--strong" d="M128 264l178-142 284 14" data-signal-motion="trace" />
        </>
  ),
  "context-rings": () => (
        <>
          <g data-signal-motion="orbit">
            {range(7).map((index) => (
              <ellipse className={index % 2 ? "post-signal__ring post-signal__ring--broken" : "post-signal__ring"} cx={320 + index * 14} cy={180} key={index} rx={76 + index * 32} ry={42 + index * 16} />
            ))}
          </g>
          <circle className="post-signal__core" cx="360" cy="180" data-signal-motion="pulse" r="18" />
        </>
  ),
  "cost-contours": (seed) => (
        <>
          {range(10).map((index) => (
            <path className="post-signal__contour" d={`M${78 + index * 8} ${232 - index * 9}C${138 + index * 7} ${72 + index * 3},${286 + index * 4} ${66 + index * 7},${354 + index * 7} ${164 - index * 4}S${548 - index * 3} ${290 - index * 8},${646 - index * 7} ${118 + index * 5}`} data-signal-motion="trace" key={index} />
          ))}
          <Nodes count={8} seed={seed} />
        </>
  ),
  "contract-bridge": (seed) => (
        <>
          <path className="post-signal__bridge" d="M76 270h568M130 270V153m460 117V153M130 153c125-127 335-127 460 0M130 153c125 83 335 83 460 0" data-signal-motion="trace" />
          {range(9).map((index) => (
            <line className="post-signal__bridge-strut" data-signal-motion="float" key={index} x1={158 + index * 51} x2={158 + index * 51} y1={119 + Math.abs(4 - index) * 10} y2="232" />
          ))}
          <Nodes count={6} seed={seed} />
        </>
  ),
  "workspace-beacon": () => (
        <>
          <path className="post-signal__beacon" d="M360 68L126 286h468z" />
          {range(7).map((index) => (
            <path className="post-signal__trace" d={`M360 ${98 + index * 23}L${174 - index * 4} 286h${372 + index * 8}z`} data-signal-motion="trace" key={index} />
          ))}
          <circle className="post-signal__core" cx="360" cy="68" data-signal-motion="pulse" r="12" />
        </>
  ),
} satisfies Record<DitherVariant, SignalDiagramRenderer>;

function SignalDiagram({ seed, variant }: { seed: number; variant: DitherVariant }) {
  return SIGNAL_DIAGRAMS[variant](seed);
}

function startSignalMotion(element: HTMLDivElement, seed: number) {
  let disposed = false;
  let revertScope: (() => void) | undefined;

  void loadAnimeRuntime()
    .then(({ animate, createScope, stagger }) => {
      if (disposed || !element.isConnected) return;
      const scope = createScope({
        mediaQueries: { motion: "(prefers-reduced-motion: no-preference)" },
        root: element,
      }).add((activeScope) => {
        if (!activeScope?.matches.motion) {
          element.dataset.motion = "static";
          return;
        }

        element.dataset.motion = "active";
        const run = (
          selector: string,
          parameters: Parameters<typeof animate>[1],
          limit = 4,
        ) => {
          const targets = Array.from(element.querySelectorAll(selector)).slice(0, limit);
          if (targets.length > 0) animate(targets, parameters);
        };

        run("[data-signal-motion='trace']", {
          delay: stagger(55),
          duration: 4_200 + (seed % 1_800),
          ease: "inOutSine",
          loop: true,
          opacity: [0.42, 0.92, 0.42],
        });
        run("[data-signal-motion='orbit']", {
          rotate: [`${seed % 45}deg`, `${360 + (seed % 45)}deg`],
          duration: 14_000 + (seed % 6_000),
          ease: "linear",
          loop: true,
        }, 1);
        run("[data-signal-motion='node']", {
          delay: stagger(120, { from: seed % 2 === 0 ? "first" : "center" }),
          duration: 2_600 + (seed % 1_400),
          ease: "inOutSine",
          loop: true,
          opacity: [0.28, 1, 0.28],
          scale: [0.82, 1.18, 0.82],
        }, 4);
        run("[data-signal-motion='bar']", {
          delay: stagger(75, { from: "center" }),
          duration: 2_100 + (seed % 1_100),
          ease: "inOutSine",
          loop: true,
          scaleY: [0.28, 1, 0.48],
        }, 5);
        run("[data-signal-motion='scan']", {
          duration: 4_800 + (seed % 1_800),
          ease: "inOutSine",
          loop: true,
          translateX: ["-18%", "118%"],
        }, 1);
        run("[data-signal-motion='float']", {
          alternate: true,
          delay: stagger(90),
          duration: 2_800 + (seed % 1_500),
          ease: "inOutSine",
          loop: true,
          translateY: [-3, 4],
        }, 3);
        run("[data-signal-motion='pulse']", {
          delay: stagger(140),
          duration: 2_000 + (seed % 900),
          ease: "inOutSine",
          loop: true,
          opacity: [0.34, 1, 0.34],
          scale: [0.8, 1.16, 0.8],
        }, 3);

        return () => {
          element.dataset.motion = "static";
        };
      });
      revertScope = () => scope.revert();
    })
    .catch(() => {
      if (!disposed) element.dataset.motion = "static";
    });

  return () => {
    disposed = true;
    revertScope?.();
    element.dataset.motion = "static";
  };
}

interface SignalMotionCandidate {
  element: HTMLDivElement;
  isEligible: boolean;
  seed: number;
  stopMotion?: () => void;
}

interface SignalMotionRegistration {
  unregister: () => void;
  updateIntersection: (isIntersecting: boolean, intersectionRatio: number) => void;
}

const signalMotionCandidates = new Set<SignalMotionCandidate>();
let activeSignalMotionCandidate: SignalMotionCandidate | undefined;
let signalMotionPreference: MediaQueryList | undefined;

function selectSignalMotionCandidate() {
  if (!(signalMotionPreference?.matches ?? true)) return undefined;

  if (
    activeSignalMotionCandidate
    && signalMotionCandidates.has(activeSignalMotionCandidate)
    && activeSignalMotionCandidate.element.isConnected
    && activeSignalMotionCandidate.isEligible
  ) {
    return activeSignalMotionCandidate;
  }

  for (const candidate of signalMotionCandidates) {
    if (
      !candidate.element.isConnected
      || !candidate.isEligible
    ) {
      continue;
    }
    return candidate;
  }
  return undefined;
}

function reconcileSignalMotionCandidates() {
  const selected = selectSignalMotionCandidate();
  if (selected === activeSignalMotionCandidate) return;

  activeSignalMotionCandidate?.stopMotion?.();
  if (activeSignalMotionCandidate) {
    activeSignalMotionCandidate.stopMotion = undefined;
  }
  activeSignalMotionCandidate = selected;
  if (selected) {
    selected.stopMotion = startSignalMotion(selected.element, selected.seed);
  }
}

function handleSignalMotionPreferenceChange() {
  reconcileSignalMotionCandidates();
}

function ensureSignalMotionPreference() {
  if (signalMotionPreference || typeof window.matchMedia !== "function") return;
  signalMotionPreference = window.matchMedia("(prefers-reduced-motion: no-preference)");
  signalMotionPreference.addEventListener("change", handleSignalMotionPreferenceChange);
}

function releaseSignalMotionPreference() {
  if (signalMotionCandidates.size > 0) return;
  signalMotionPreference?.removeEventListener(
    "change",
    handleSignalMotionPreferenceChange,
  );
  signalMotionPreference = undefined;
}

function registerSignalMotionCandidate(
  element: HTMLDivElement,
  seed: number,
): SignalMotionRegistration {
  const candidate: SignalMotionCandidate = {
    element,
    isEligible: false,
    seed,
  };
  signalMotionCandidates.add(candidate);
  ensureSignalMotionPreference();

  return {
    unregister: () => {
      if (!signalMotionCandidates.delete(candidate)) return;
      reconcileSignalMotionCandidates();
      releaseSignalMotionPreference();
      element.dataset.motion = "static";
    },
    updateIntersection: (isIntersecting, intersectionRatio) => {
      if (!signalMotionCandidates.has(candidate)) return;
      const nextEligibility = isIntersecting
        && Number.isFinite(intersectionRatio)
        && intersectionRatio >= SIGNAL_INTERSECTION_THRESHOLD;
      if (candidate.isEligible === nextEligibility) return;
      candidate.isEligible = nextEligibility;
      reconcileSignalMotionCandidates();
    },
  };
}

export function PostSignalArtwork({
  children,
  className = "",
  decorative = false,
  label,
  seed,
  variant,
  ...props
}: PostSignalArtworkProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numericSeed = useMemo(
    () => stableDitherSeed(`${seed}:${variant}`),
    [seed, variant],
  );
  const assignments = useMemo(
    () => cornerAssignments(numericSeed),
    [numericSeed],
  );

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    element.dataset.motion = "static";
    if (typeof IntersectionObserver === "undefined") return;

    const motionRegistration = registerSignalMotionCandidate(element, numericSeed);
    const observer = new IntersectionObserver(
      (entries) => {
        let newestEntry: IntersectionObserverEntry | undefined;
        for (const entry of entries) {
          if (entry.target === element) newestEntry = entry;
        }
        if (!newestEntry) return;
        motionRegistration.updateIntersection(
          newestEntry.isIntersecting,
          newestEntry.intersectionRatio,
        );
      },
      {
        rootMargin: SIGNAL_NEAR_VIEWPORT_MARGIN,
        threshold: SIGNAL_INTERSECTION_THRESHOLD,
      },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      motionRegistration.unregister();
    };
  }, [numericSeed]);

  return (
    <div
      {...props}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={`dither-artwork post-signal ${className}`.trim()}
      data-dither-seed={numericSeed}
      data-motion="static"
      data-signal-variant={variant}
      data-slot="post-signal-artwork"
      ref={rootRef}
      role={decorative ? undefined : "img"}
    >
      <div aria-hidden="true" className="post-signal__texture" />
      <svg aria-hidden="true" className="post-signal__diagram" preserveAspectRatio="xMidYMid meet" viewBox="0 0 720 360">
        <SignalDiagram seed={numericSeed} variant={variant} />
      </svg>
      {assignments.map((assignment) => (
        <CornerInstrument {...assignment} key={assignment.corner} />
      ))}
      <span aria-hidden="true" className="post-signal__code">
        {variant.replaceAll("-", " / ")}
      </span>
      {children}
    </div>
  );
}
