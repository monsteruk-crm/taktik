import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type OverlayTone = "neutral" | "info" | "warning" | "danger" | "focus";
type OverlayAccent = "blue" | "red" | "yellow" | "black";

type OverlayPanelProps = {
  title: string;
  tone?: OverlayTone;
  accent?: OverlayAccent;
  children: ReactNode;
  rightActions?: ReactNode;
};

const TONE_BG: Record<OverlayTone, string> = {
  neutral: "#DEDED8",
  info: "#D9E4EF",
  warning: "#EFE5C7",
  danger: "#E9D0D0",
  focus: "#E7E0C6",
};

const ACCENT_COLOR: Record<OverlayAccent, string> = {
  blue: "#1F4E79",
  red: "#C1121F",
  yellow: "#F2B705",
  black: "#1B1B1B",
};

export default function OverlayPanel({
  title,
  tone = "neutral",
  accent = "black",
  children,
  rightActions,
}: OverlayPanelProps) {
  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: TONE_BG[tone],
        border: "2px solid #1B1B1B",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 4,
          border: "1px solid rgba(27, 27, 27, 0.25)",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          border: "2px solid #1B1B1B",
          backgroundColor: "var(--panel)",
          px: 1.5,
          py: 0.75,
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            backgroundColor: ACCENT_COLOR[accent],
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 3,
            border: "1px solid rgba(27, 27, 27, 0.25)",
            pointerEvents: "none",
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="caption" fontWeight={800}>
            {title}
          </Typography>
          {rightActions ? <Box>{rightActions}</Box> : null}
        </Stack>
      </Box>
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
