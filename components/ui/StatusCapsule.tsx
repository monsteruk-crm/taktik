import type { ReactNode } from "react";
import Box from "@mui/material/Box";

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
  neutral: "#E6E6E2",
  blue: "#D9E4EF",
  red: "#E9D0D0",
  yellow: "#E7E0C6",
  black: "#1B1B1B",
};

export default function StatusCapsule({
  label,
  value,
  tone = "neutral",
  compact,
  icon,
  maxWidth,
}: StatusCapsuleProps) {
  const isBlack = tone === "black";
  const textColor = isBlack ? "#E6E6E2" : "#1B1B1B";
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: compact ? 1 : 1.25,
        py: compact ? 0.35 : 0.6,
        border: "2px solid #1B1B1B",
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
          border: "1px solid rgba(27, 27, 27, 0.25)",
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
