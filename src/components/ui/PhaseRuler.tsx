import Box from "@mui/material/Box";
import { useEffect, useMemo, useRef, useState } from "react";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";
import { semanticColors } from "@/lib/ui/semanticColors";

type PhaseRulerProps = {
  phase: string;
  compact?: boolean;
  hideTopBorder?: boolean;
};

const PHASE_ORDER = ["TURN_START", "DRAW", "MOVE", "ATTACK", "DICE", "END"];

function getPhaseIndex(phase: string) {
  const normalized = phase.toUpperCase();
  if (normalized.includes("TURN_START") || normalized.includes("START")) return 0;
  if (normalized.includes("DRAW") || normalized.includes("CARD")) return 1;
  if (normalized.includes("MOVE")) return 2;
  if (normalized.includes("ATTACK")) return 3;
  if (normalized.includes("DICE")) return 4;
  if (normalized.includes("END")) return 5;
  return 0;
}

type SegmentPath = {
  d: string;
  key: string;
};

export default function PhaseRuler({ phase, compact, hideTopBorder }: PhaseRulerProps) {
  const reducedMotion = useReducedMotion();
  const activeIndex = getPhaseIndex(phase);
  const height = compact ? 16 : 18; // spec: 8–10 mobile, 10–12 desktop
  const ref = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const segments: SegmentPath[] = useMemo(() => {
    const n = PHASE_ORDER.length;
    const tooth = height / 2; // toothWidth = H/2 per spec
    const step = width / n;

    // Geometry: each segment is a modified chevron.
    // The right tooth extends into the next segment's left notch.
    // Notch and tooth share identical geometry (isosceles triangle with base = H).
    return PHASE_ORDER.map((label, index) => {
      const x0 = step * index;
      const isFirst = index === 0;
      const isLast = index === n - 1;

      const leftOuter = x0;
      const notchTip = isFirst ? x0 : x0 + tooth;
      const bodyRight = x0 + step;
      const rightShoulder = isLast ? bodyRight : bodyRight;
      const rightTip = isLast ? bodyRight : bodyRight + tooth;

      const d = [
        `M ${leftOuter} 0`,
        `L ${rightShoulder} 0`,
        `L ${rightTip} ${height / 2}`,
        `L ${rightShoulder} ${height}`,
        `L ${leftOuter} ${height}`,
        `L ${notchTip} ${height / 2}`,
        "Z",
      ].join(" ");

      return { d, key: `${label}-${index}` };
    });
  }, [height, width]);

  return (
    <Box
      sx={{
        position: "relative",
        borderTop: hideTopBorder ? "none" : `2px solid ${semanticColors.ink}`,
        borderBottom: `2px solid ${semanticColors.ink}`,
        height,
        width: "100%",
        backgroundColor: semanticColors.surface,
        overflow: "hidden",
        "@keyframes phasePulse": {
          "0%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.12)" },
          "100%": { transform: "scaleY(1)" },
        },
      }}
    >
      <svg
        ref={ref}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="presentation"
        shapeRendering="crispEdges"
      >
        {segments.map((seg, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          const fill = isActive
            ? semanticColors.ink
            : isComplete
              ? semanticColors.panel2
              : semanticColors.surface;

          return (
            <path
              key={`${seg.key}-${activeIndex}`}
              d={seg.d}
              fill={fill}
              stroke={semanticColors.ink}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="miter"
              style={{
                transition: reducedMotion
                  ? "none"
                  : `fill ${DUR.fast}ms ${EASE.stiff}, transform ${DUR.fast}ms ${EASE.stiff}`,
                transformOrigin: "center",
                transform:
                  isActive && !reducedMotion ? "scaleY(1.08)" : "scaleY(1)",
              }}
            />
          );
        })}
      </svg>
    </Box>
  );
}
