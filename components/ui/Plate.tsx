import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";

type PlateProps = {
  children: ReactNode;
  accentColor?: string;
} & BoxProps;

export default function Plate({ children, accentColor, sx, ...rest }: PlateProps) {
  return (
    <Box
      {...rest}
      sx={{
        position: "relative",
        border: "2px solid #1B1B1B",
        backgroundColor: "#E6E6E2",
        color: "#1B1B1B",
        px: 1.5,
        py: 0.75,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 1,
        ...(accentColor
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 8,
                backgroundColor: accentColor,
              },
              pl: 2.5,
            }
          : null),
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 2,
          border: "1px solid rgba(27, 27, 27, 0.35)",
          pointerEvents: "none",
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
