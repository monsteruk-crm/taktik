import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Plate from "@/components/ui/Plate";

type FrameProps = {
  children: ReactNode;
  titleLeft?: string;
  titleRight?: string;
  accentColor?: string;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

export default function Frame({
  children,
  titleLeft,
  titleRight,
  accentColor,
  sx,
  contentSx,
}: FrameProps) {
  const hasHeader = Boolean(titleLeft || titleRight);
  return (
    <Box
      sx={{
        position: "relative",
        border: "2px solid #1B1B1B",
        p: 0,
        backgroundColor: "transparent",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 4,
          border: "1px solid rgba(27, 27, 27, 0.25)",
          pointerEvents: "none",
        },
        ...sx,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          position: "relative",
          zIndex: 1,
          backgroundColor: "var(--panel)",
          ...contentSx,
        }}
      >
        {hasHeader ? (
          <Plate accentColor={accentColor} sx={{ py: 0.5 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ width: "100%" }}
            >
              <span>{titleLeft}</span>
              {titleRight ? <span>{titleRight}</span> : null}
            </Stack>
          </Plate>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}
