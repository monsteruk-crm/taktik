import type { ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import { DUR, EASE } from "@/lib/ui/motion";
import { semanticColors, textOn } from "@/lib/ui/semanticColors";

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

const TONE_ACTIVE: Record<ObliqueKeyTone, string> = {
  neutral: semanticColors.panel2,
  blue: semanticColors.move,
  red: semanticColors.attack,
  yellow: semanticColors.dice,
  black: semanticColors.ink,
};

const TONE_STRIPE: Record<ObliqueKeyTone, string> = {
  neutral: semanticColors.neutralStripe,
  blue: semanticColors.move,
  red: semanticColors.attack,
  yellow: semanticColors.dice,
  black: semanticColors.ink,
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
  const activeFill = TONE_ACTIVE[tone];
  const stripeColor = disabled
    ? undefined
    : active
      ? accentColor
      : accentColor ?? TONE_STRIPE[tone];
  const fillColor = active ? activeFill : semanticColors.panel;
  const hoverFill = active ? activeFill : semanticColors.panel2;
  const textColor = active ? textOn(activeFill) : semanticColors.ink;
  const backgroundImage = stripeColor
    ? `linear-gradient(90deg, ${stripeColor} 0 6px, ${fillColor} 6px 100%)`
    : "none";
  const hoverBackgroundImage = stripeColor
    ? `linear-gradient(90deg, ${stripeColor} 0 6px, ${hoverFill} 6px 100%)`
    : "none";

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: "relative",
        height: size === "sm" ? { xs: 32, md: 36 } : { xs: 36, md: 40 },
        minWidth: size === "sm" ? { xs: 84, md: 96 } : { xs: 92, md: 110 },
        px: size === "sm" ? 1.5 : 2,
        border: `2px solid ${semanticColors.ink}`,
        backgroundColor: fillColor,
        backgroundImage,
        color: textColor,
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
          border: `1px solid ${semanticColors.neutralStripe}`,
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
        "&:hover": {
          backgroundColor: hoverFill,
          backgroundImage: hoverBackgroundImage,
          color: active ? textOn(activeFill) : semanticColors.ink,
        },
        "&:active": {
          transform: "translateY(1px)",
        },
        "&:active::after": {
          border: "0 solid transparent",
        },
        "&.Mui-focusVisible": {
          outline: `2px solid ${semanticColors.move}`,
        },
        "&.Mui-disabled": {
          opacity: 0.35,
          color: semanticColors.ink,
          backgroundColor: semanticColors.panel2,
          backgroundImage: "none",
          cursor: "default",
        },
        "&.Mui-disabled:hover": {
          backgroundColor: semanticColors.panel2,
          backgroundImage: "none",
          color: semanticColors.ink,
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
          backgroundColor: semanticColors.ink,
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
