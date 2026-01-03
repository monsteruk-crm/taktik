import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { semanticColors, textOn } from "@/lib/ui/semanticColors";

type BandHeaderProps = {
  titleLeft: string;
  titleRight?: string;
  accentColor?: string;
};

export default function BandHeader({
  titleLeft,
  titleRight,
  accentColor,
}: BandHeaderProps) {
  const bandText = textOn(semanticColors.ink);
  return (
    <Box
      sx={{
        position: "relative",
        border: `2px solid ${semanticColors.ink}`,
        backgroundColor: semanticColors.ink,
        color: bandText,
        minHeight: 36,
        px: 1.75,
        display: "flex",
        alignItems: "center",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 800,
        "&::before": accentColor
          ? {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 6,
              backgroundColor: accentColor,
            }
          : undefined,
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 3,
          border: `1px solid ${semanticColors.ink2}`,
          pointerEvents: "none",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <Typography variant="caption" fontWeight={800}>
          {titleLeft}
        </Typography>
        {titleRight ? (
          <Typography variant="caption" fontWeight={700}>
            {titleRight}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
