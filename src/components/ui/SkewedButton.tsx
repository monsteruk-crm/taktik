import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

type SkewedButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  children?: ReactNode;
  label?: string;
};

export default function SkewedButton({
  children,
  label = "Skewed Button",
  sx,
  ...rest
}: SkewedButtonProps) {
  const baseTransform = "skewX(-20deg)";
  return (
    <Button
      variant="contained"
      sx={{
        transform: baseTransform,
        padding: "8px 24px",
        "&:hover": {
          transform: baseTransform,
        },
        ...sx,
      }}
      {...rest}
    >
      <Box component="span" sx={{ transform: "skewX(20deg)" }}>
        {children ?? label}
      </Box>
    </Button>
  );
}
