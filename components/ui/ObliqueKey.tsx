import type { ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import { DUR, EASE } from "@/lib/ui/motion";

type ObliqueKeyTone = "neutral" | "blue" | "red" | "yellow" | "black";

type ObliqueKeyProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: ObliqueKeyTone;
  active?: boolean;
  accentColor?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  size?: "sm" | "md";
};

const TONE_BG: Record<ObliqueKeyTone, string> = {
  neutral: "#E6E6E2",
  blue: "#D9E4EF",
  red: "#E9D0D0",
  yellow: "#E7E0C6",
  black: "#1B1B1B",
};

const CLIP_PATH = "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)";

export default function ObliqueKey({
  label,
  onClick,
  disabled,
  tone = "neutral",
  active,
  accentColor,
  startIcon,
  endIcon,
  size = "md",
}: ObliqueKeyProps) {
  const isBlack = tone === "black";
  const baseBg = TONE_BG[tone];
  const baseColor = isBlack ? "#E6E6E2" : "#1B1B1B";
  const stripeColor = accentColor ?? (isBlack ? "#C1121F" : undefined);

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: "relative",
        height: size === "sm" ? { xs: 32, md: 36 } : { xs: 36, md: 40 },
        minWidth: size === "sm" ? { xs: 84, md: 96 } : { xs: 92, md: 110 },
        px: size === "sm" ? 1.5 : 2,
        border: "2px solid #1B1B1B",
        backgroundColor: active ? "#1B1B1B" : baseBg,
        color: active ? "#E6E6E2" : baseColor,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 800,
        fontSize: size === "sm" ? "0.65rem" : "0.7rem",
        clipPath: CLIP_PATH,
        outlineOffset: 2,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        transition: `background-color ${DUR.micro}ms ${EASE.snap}, color ${DUR.micro}ms ${EASE.snap}, transform ${DUR.micro}ms ${EASE.snap}`,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 3,
          border: "1px solid rgba(27, 27, 27, 0.35)",
          clipPath: CLIP_PATH,
          pointerEvents: "none",
        },
        ...(active
          ? {
              "& .oblique-rail": {
                opacity: 1,
              },
            }
          : null),
        ...(stripeColor
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 6,
                backgroundColor: stripeColor,
                clipPath: CLIP_PATH,
              },
            }
          : null),
        "&:hover": {
          backgroundColor: "#1B1B1B",
          color: "#E6E6E2",
        },
        "&:active": {
          transform: "translateY(1px)",
        },
        "&:active::after": {
          border: "0 solid transparent",
        },
        "&.Mui-focusVisible": {
          outline: "2px solid #1F4E79",
        },
        "&.Mui-disabled": {
          opacity: 0.35,
          color: baseColor,
          backgroundColor: baseBg,
          cursor: "default",
        },
        "&.Mui-disabled:hover": {
          backgroundColor: baseBg,
          color: baseColor,
        },
        "&.Mui-disabled .oblique-rail": {
          opacity: 0,
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:active": {
            transform: "none",
          },
        },
      }}
    >
      <Box
        className="oblique-rail"
        aria-hidden="true"
        sx={{
          position: "absolute",
          left: 4,
          right: 4,
          bottom: -4,
          height: 2,
          backgroundColor: "#1B1B1B",
          opacity: active ? 1 : 0,
          transition: `opacity ${DUR.micro}ms ${EASE.snap}`,
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      />
      {startIcon ? <Box sx={{ display: "inline-flex" }}>{startIcon}</Box> : null}
      {label}
      {endIcon ? <Box sx={{ display: "inline-flex" }}>{endIcon}</Box> : null}
    </ButtonBase>
  );
}
