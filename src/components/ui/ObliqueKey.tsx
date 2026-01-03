import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import { DUR, EASE } from "@/lib/ui/motion";
import { semanticColors, textOn } from "@/lib/ui/semanticColors";

type ObliqueKeyTone = "neutral" | "blue" | "red" | "yellow" | "black";
type ObliqueKeyCutout = "move" | "attack";

type ObliqueKeyProps = ComponentPropsWithoutRef<typeof ButtonBase> & {
  label?: string;
  tone?: ObliqueKeyTone;
  active?: boolean;
  accentColor?: string;
  cutout?: ObliqueKeyCutout;
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

const MOVE_CUTOUT = (
  <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="currentColor">
      <polygon points="10,10 20,20 10,30 14,30 24,20 14,10" />
      <polygon points="30,10 40,20 30,30 34,30 44,20 34,10" />
      <polygon points="50,10 60,20 50,30 54,30 64,20 54,10" />
      <polygon points="70,10 80,20 70,30 74,30 84,20 74,10" />
    </g>
  </svg>
);

const ATTACK_CUTOUT = (
  <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g fill="currentColor">
      <polygon points="50,6 54,18 66,14 58,22 70,26 56,26 60,38 50,28 40,38 44,26 30,26 42,22 34,14 46,18" />
    </g>
  </svg>
);

const CUTOUT_SVGS: Record<ObliqueKeyCutout, ReactNode> = {
  move: MOVE_CUTOUT,
  attack: ATTACK_CUTOUT,
};

const mixHex = (hexA: string, hexB: string, weightB: number) => {
  const normalize = (hex: string) => hex.replace("#", "");
  const toRgb = (hex: string) => {
    const normalized = normalize(hex);
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => char + char)
            .join("")
        : normalized;
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  };
  const a = toRgb(hexA);
  const b = toRgb(hexB);
  const weightA = 1 - weightB;
  const mix = (start: number, end: number) =>
    Math.round(start * weightA + end * weightB);
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(mix(a.r, b.r))}${toHex(mix(a.g, b.g))}${toHex(mix(a.b, b.b))}`;
};

export default function ObliqueKey({
  label,
  disabled,
  tone = "neutral",
  active,
  accentColor,
  cutout,
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
  const symbolBase = cutout
    ? active
      ? cutout === "move"
        ? semanticColors.move
        : semanticColors.attack
      : semanticColors.panel
    : null;
  const symbolColor = symbolBase
    ? disabled
      ? mixHex(semanticColors.panel2, semanticColors.ink, 0.18)
      : active
        ? mixHex(symbolBase, semanticColors.surface, 0.45)
        : mixHex(semanticColors.panel, semanticColors.ink, 0.35)
    : undefined;

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
        "& > .ObliqueKey-content": {
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.75,
        },
        ...(cutout
          ? {
              "& > .ObliqueKey-cutout": {
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                top: 4,
                bottom: 4,
                right: 4,
                left: "45%",
                color: symbolColor,
                zIndex: 0,
                pointerEvents: "none",
              },
              "& > .ObliqueKey-cutout svg": {
                width: "200%",
                height: "120%",
              },
            }
          : null),
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
      {cutout ? (
        <Box className="ObliqueKey-cutout" aria-hidden="true">
          {CUTOUT_SVGS[cutout]}
        </Box>
      ) : null}
      <Box className="ObliqueKey-content">
        {startIcon ? <Box sx={{ display: "inline-flex" }}>{startIcon}</Box> : null}
        <Box component="span" sx={{ transform: `skewX(${COUNTER_SKEW})` }}>
          {children ?? label}
        </Box>
        {endIcon ? <Box sx={{ display: "inline-flex" }}>{endIcon}</Box> : null}
      </Box>
    </ButtonBase>
  );
}
