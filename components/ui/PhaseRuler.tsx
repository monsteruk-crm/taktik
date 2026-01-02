import Box from "@mui/material/Box";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";

type PhaseRulerProps = {
  phase: string;
  compact?: boolean;
  hideTopBorder?: boolean;
};

const SEGMENT_COUNT = 8;
const PHASE_ORDER = ["TURN_START", "DRAW", "MOVE", "ATTACK", "DICE", "END"];

function getPhaseIndex(phase: string) {
  const normalized = phase.toUpperCase();
  if (normalized.includes("TURN_START") || normalized.includes("START")) {
    return 0;
  }
  if (normalized.includes("DRAW") || normalized.includes("CARD")) {
    return 1;
  }
  if (normalized.includes("MOVE")) {
    return 2;
  }
  if (normalized.includes("ATTACK")) {
    return 3;
  }
  if (normalized.includes("DICE")) {
    return 4;
  }
  if (normalized.includes("END")) {
    return 5;
  }
  return 0;
}

export default function PhaseRuler({ phase, compact, hideTopBorder }: PhaseRulerProps) {
  const reducedMotion = useReducedMotion();
  const phaseIndex = getPhaseIndex(phase);
  const activeSegment = Math.round(
    (phaseIndex * (SEGMENT_COUNT - 1)) / (PHASE_ORDER.length - 1)
  );
  const height = compact ? 9 : 12;
  const tickPositions = [0.25, 0.5, 0.75];
  const markerLeft = ((activeSegment + 0.5) / SEGMENT_COUNT) * 100;

  return (
    <Box
      sx={{
        position: "relative",
        borderTop: hideTopBorder ? "none" : "2px solid #1B1B1B",
        borderBottom: "2px solid #1B1B1B",
        height,
        width: "100%",
        backgroundColor: "#E6E6E2",
        display: "grid",
        gridTemplateColumns: `repeat(${SEGMENT_COUNT}, 1fr)`,
        gap: 2,
        alignItems: "stretch",
        px: 1,
        overflow: "hidden",
        "@keyframes phasePulse": {
          "0%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.15)" },
          "100%": { transform: "scaleY(1)" },
        },
      }}
    >
      {tickPositions.map((pos) => (
        <Box
          key={`tick-${pos}`}
          sx={{
            position: "absolute",
            left: `${pos * 100}%`,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: "2px solid #1B1B1B",
            pointerEvents: "none",
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: `calc(${markerLeft}% - 6px)`,
          width: 12,
          height: 6,
          backgroundColor: "#1B1B1B",
          clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
          pointerEvents: "none",
        }}
      />
      {Array.from({ length: SEGMENT_COUNT }).map((_, index) => {
        const isActive = index === activeSegment;
        const isComplete = index < activeSegment;
        return (
          <Box
            key={`segment-${index}-${activeSegment}`}
            sx={{
              border: "1px solid #1B1B1B",
              backgroundColor: isActive
                ? "#1B1B1B"
                : isComplete
                  ? "var(--action-panel)"
                  : "#E6E6E2",
              transition: reducedMotion
                ? "none"
                : `background-color ${DUR.fast}ms ${EASE.stiff}`,
              transformOrigin: "center",
              animation:
                isActive && !reducedMotion
                  ? `phasePulse ${DUR.fast}ms ${EASE.stiff}`
                  : "none",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
                animation: "none",
              },
            }}
          />
        );
      })}
    </Box>
  );
}
