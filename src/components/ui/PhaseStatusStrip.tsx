import type { BoxProps } from "@mui/material/Box";
import Box from "@mui/material/Box";
import StatusCapsule from "@/components/ui/StatusCapsule";
import { BORDER, GAP_SM } from "@/lib/ui/layoutTokens";
import { semanticColors } from "@/lib/ui/semanticColors";

type PhaseStatusStripProps = {
  vp?: string | number;
  showVp?: boolean;
  turn: number;
  phaseLabel: string;
  compact?: boolean;
  maxPhaseWidth?: number;
  wrap?: boolean;
  framed?: boolean;
} & BoxProps;

export default function PhaseStatusStrip({
  vp,
  showVp = true,
  turn,
  phaseLabel,
  compact = true,
  maxPhaseWidth,
  wrap = false,
  framed = true,
  sx,
  ...rest
}: PhaseStatusStripProps) {
  return (
    <Box
      {...rest}
      sx={{
        ...(framed
          ? {
              border: `${BORDER}px solid ${semanticColors.ink}`,
              backgroundColor: "var(--panel)",
              px: compact ? 1 : 1.25,
              py: compact ? 0.75 : 1,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 3,
                border: `1px solid ${semanticColors.neutralStripe}`,
                pointerEvents: "none",
              },
            }
          : {
              border: "none",
              backgroundColor: "transparent",
              px: 0,
              py: 0,
            }),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: wrap ? "wrap" : "nowrap",
          gap: `${GAP_SM}px`,
        }}
      >
        {showVp ? (
          <StatusCapsule label="VP" value={vp ?? "--"} compact={compact} icon={null} />
        ) : null}
        <StatusCapsule label="TURN" value={turn} compact={compact} icon={null} />
        <StatusCapsule
          label="PHASE"
          value={phaseLabel}
          compact={compact}
          icon={null}
          maxWidth={maxPhaseWidth}
        />
      </Box>
    </Box>
  );
}
