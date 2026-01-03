import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import { DUR, EASE } from "@/lib/ui/motion";
import { semanticColors, textOn } from "@/lib/ui/semanticColors";

type ObliqueKeyTone = "neutral" | "blue" | "red" | "yellow" | "black";

type ObliqueKeyProps = ComponentPropsWithoutRef<typeof ButtonBase> & {
  label?: string;
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

const SKEW = "-12deg";
const COUNTER_SKEW = "12deg";

export default function ObliqueKey({
  label,
  disabled,
  tone = "neutral",
  active,
  accentColor,
  startIcon,
  endIcon,
  size = "md",
  children,
  sx,
  ...rest
}: ObliqueKeyProps) {
  const activeFill = TONE_ACTIVE[tone];
  const stripeColor = disabled
    ? undefined
    : active
      ? accentColor ?? TONE_STRIPE[tone]
      : accentColor ?? TONE_STRIPE[tone];
  const showStripe = Boolean(stripeColor) && !active;
  const fillColor = active ? activeFill : semanticColors.panel;
  const hoverFill = active ? activeFill : semanticColors.panel2;
  const textColor = active ? textOn(activeFill) : semanticColors.ink;

  return (
    <ButtonBase
      disabled={disabled}
      sx={{
        position: "relative",
        height: size === "sm" ? { xs: 32, md: 36 } : { xs: 36, md: 40 },
        minWidth: size === "sm" ? { xs: 84, md: 96 } : { xs: 92, md: 110 },
        px: size === "sm" ? 1.5 : 2,
        border: `2px solid ${semanticColors.ink}`,
        backgroundColor: fillColor,
        color: textColor,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 800,
        fontSize: size === "sm" ? "0.65rem" : "0.7rem",
        outlineOffset: 2,
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        transform: `skewX(${SKEW})`,
        transition: `background-color ${DUR.micro}ms ${EASE.snap}, color ${DUR.micro}ms ${EASE.snap}, transform ${DUR.micro}ms ${EASE.snap}`,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 3,
          border: `1px solid ${semanticColors.neutralStripe}`,
          pointerEvents: "none",
        },
        ...(showStripe
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 6,
                backgroundColor: stripeColor,
                pointerEvents: "none",
              },
            }
          : null),
        "&:hover": {
          backgroundColor: hoverFill,
          color: active ? textOn(activeFill) : semanticColors.ink,
        },
        "&:active": {
          transform: `skewX(${SKEW}) translateY(1px)`,
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
          cursor: "default",
        },
        "&.Mui-disabled:hover": {
          backgroundColor: semanticColors.panel2,
          color: semanticColors.ink,
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:active": {
            transform: `skewX(${SKEW})`,
          },
        },
        ...sx,
      }}
      {...rest}
    >
      {startIcon ? <Box sx={{ display: "inline-flex" }}>{startIcon}</Box> : null}
      <Box component="span" sx={{ transform: `skewX(${COUNTER_SKEW})` }}>
        {children ?? label}
      </Box>
      {endIcon ? <Box sx={{ display: "inline-flex" }}>{endIcon}</Box> : null}
    </ButtonBase>
  );
}
