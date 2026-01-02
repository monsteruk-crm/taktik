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
        p: 0.75,
        backgroundColor: "transparent",
        ...sx,
      }}
    >
      <Box
        sx={{
          border: "2px solid #1B1B1B",
          p: 1.5,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
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
