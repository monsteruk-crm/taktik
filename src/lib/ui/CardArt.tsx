import Box from "@mui/material/Box";
import type { CardDefinition } from "@/lib/engine/gameState";

const fallbackCardImage = "/assets/cards/placeholder.png";

type CardArtProps = {
  card: CardDefinition;
  label: string;
  maxWidth?: number | string;
  height?: number | string;
  fit?: "contain" | "cover";
  bordered?: boolean;
};

export default function CardArt({
  card,
  label,
  maxWidth = 180,
  height = "auto",
  fit = "cover",
  bordered = true,
}: CardArtProps) {
  const src = card.images?.lo ?? fallbackCardImage;
  return (
    <Box
      component="img"
      alt={label}
      src={src}
      sx={{
        width: "100%",
        maxWidth,
        height,
        objectFit: fit,
        border: bordered ? "2px solid #1B1B1B" : "none",
        borderRadius: 0,
        display: "block",
      }}
      onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        if (img.dataset.fallbackApplied === "true") {
          return;
        }
        img.dataset.fallbackApplied = "true";
        img.src = fallbackCardImage;
      }}
    />
  );
}
