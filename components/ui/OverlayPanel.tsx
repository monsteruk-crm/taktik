import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import StatusCapsule from "@/components/ui/StatusCapsule";
import { semanticColors } from "@/lib/ui/semanticColors";

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
  neutral: semanticColors.panel,
  info: semanticColors.info,
  warning: semanticColors.focus,
  danger: semanticColors.danger,
  focus: semanticColors.focus,
};

const ACCENT_COLOR: Record<OverlayAccent, string> = {
  blue: semanticColors.move,
  red: semanticColors.attack,
  yellow: semanticColors.dice,
  black: semanticColors.ink,
};

export default function OverlayPanel({
  title,
  tone = "neutral",
  accent = "black",
  children,
  rightActions,
}: OverlayPanelProps) {
  const showFocus = tone === "focus";
  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: TONE_BG[tone],
        border: `2px solid ${semanticColors.ink}`,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        ...(showFocus
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 2,
                backgroundColor: semanticColors.dice,
              },
            }
          : null),
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 4,
          border: `1px solid ${semanticColors.neutralStripe}`,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          border: `2px solid ${semanticColors.ink}`,
          backgroundColor: semanticColors.panel,
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
            border: `1px solid ${semanticColors.neutralStripe}`,
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" fontWeight={800}>
              {title}
            </Typography>
            {showFocus ? (
              <StatusCapsule label="FOCUS" value="ON" tone="yellow" compact />
            ) : null}
          </Stack>
          {rightActions ? <Box>{rightActions}</Box> : null}
        </Stack>
      </Box>
      <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
    </Box>
  );
}
