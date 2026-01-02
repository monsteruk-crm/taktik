import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { semanticColors, textOn } from "@/lib/ui/semanticColors";

type CapsuleTone = "neutral" | "blue" | "red" | "yellow" | "black";

type StatusCapsuleProps = {
  label: string;
  value: string | number;
  tone?: CapsuleTone;
  compact?: boolean;
  icon?: ReactNode;
  maxWidth?: number;
};

const TONE_BG: Record<CapsuleTone, string> = {
  neutral: semanticColors.panel,
  blue: semanticColors.move,
  red: semanticColors.attack,
  yellow: semanticColors.dice,
  black: semanticColors.ink,
};

export default function StatusCapsule({
  label,
  value,
  tone = "neutral",
  compact,
  icon,
  maxWidth,
}: StatusCapsuleProps) {
  const textColor = textOn(TONE_BG[tone]);
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: compact ? 1 : 1.25,
        py: compact ? 0.35 : 0.6,
        border: `2px solid ${semanticColors.ink}`,
        backgroundColor: TONE_BG[tone],
        color: textColor,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 800,
        fontSize: compact ? "0.65rem" : "0.7rem",
        lineHeight: 1.2,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 3,
          border: `1px solid ${semanticColors.neutralStripe}`,
          pointerEvents: "none",
        },
      }}
    >
      {icon ? <Box sx={{ display: "inline-flex" }}>{icon}</Box> : null}
      <Box component="span">{label}:</Box>
      <Box
        component="span"
        sx={{
          fontWeight: 900,
          maxWidth: maxWidth ? `${maxWidth}px` : "none",
          overflow: maxWidth ? "hidden" : "visible",
          textOverflow: maxWidth ? "ellipsis" : "clip",
          whiteSpace: maxWidth ? "nowrap" : "normal",
          display: "inline-block",
        }}
      >
        {value}
      </Box>
    </Box>
  );
}
