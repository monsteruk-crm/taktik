import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CardDefinition, TargetingSpec } from "@/lib/engine/gameState";

type CardPanelProps = {
  commonDeckCount: number;
  pendingCard: CardDefinition | null;
  storedBonuses: CardDefinition[];
  canDrawCard: boolean;
  canStoreBonus: boolean;
  canPlayCard: boolean;
  isTargeting: boolean;
  targetingSpec: TargetingSpec | null;
  selectedTargetUnitIds: string[];
  onDrawCard: () => void;
  onStoreBonus: () => void;
  onStartTargeting: () => void;
  onConfirmPlayCard: () => void;
  onCancelTargeting: () => void;
};

export default function CardPanel({
  commonDeckCount,
  pendingCard,
  storedBonuses,
  canDrawCard,
  canStoreBonus,
  canPlayCard,
  isTargeting,
  targetingSpec,
  selectedTargetUnitIds,
  onDrawCard,
  onStoreBonus,
  onStartTargeting,
  onConfirmPlayCard,
  onCancelTargeting,
}: CardPanelProps) {
  const targetingLabel =
    targetingSpec?.type === "unit"
      ? `Target: ${targetingSpec.count} ${targetingSpec.owner === "self" ? "friendly" : "enemy"} unit(s)`
      : "Target: none";

  return (
    <Paper sx={{ width: "100%", maxWidth: "100%", border: "1px solid #000", p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={600}>
          Cards
        </Typography>
        <Typography variant="body2">Common deck: {commonDeckCount} cards</Typography>
        <Box>
          <Button variant="outlined" onClick={onDrawCard} disabled={!canDrawCard}>
            Draw Card
          </Button>
        </Box>
        <Paper variant="outlined" sx={{ p: 2, borderColor: "#000" }}>
          <Stack spacing={1}>
            <Typography variant="caption" fontWeight={600}>
              Pending Card
            </Typography>
            {pendingCard ? (
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  {pendingCard.kind}: {pendingCard.name}
                </Typography>
                <Typography variant="caption">{targetingLabel}</Typography>
                {targetingSpec?.type === "unit" ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption">
                      Selected:{" "}
                      {selectedTargetUnitIds.length === 0
                        ? "None"
                        : selectedTargetUnitIds.join(", ")}
                    </Typography>
                    {isTargeting ? (
                      <Typography variant="caption">Click units on the map to select targets.</Typography>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            ) : (
              <Typography variant="caption">None</Typography>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                onClick={targetingSpec?.type === "unit" ? onStartTargeting : onConfirmPlayCard}
                disabled={!canPlayCard || (targetingSpec?.type === "unit" && isTargeting)}
              >
                {targetingSpec?.type === "unit" ? "Select Targets" : "Play Card"}
              </Button>
              {targetingSpec?.type === "unit" ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onConfirmPlayCard}
                    disabled={
                      !canPlayCard ||
                      !isTargeting ||
                      selectedTargetUnitIds.length !== targetingSpec.count
                    }
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onCancelTargeting}
                    disabled={!isTargeting}
                  >
                    Cancel
                  </Button>
                </>
              ) : null}
              <Button
                variant="outlined"
                size="small"
                onClick={onStoreBonus}
                disabled={!canStoreBonus}
              >
                Store Bonus
              </Button>
            </Stack>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderColor: "#000" }}>
          <Stack spacing={1}>
            <Typography variant="caption" fontWeight={600}>
              Stored Bonuses ({storedBonuses.length}/6)
            </Typography>
            <Stack spacing={0.5}>
              {storedBonuses.length === 0 ? (
                <Typography variant="caption">None</Typography>
              ) : (
                storedBonuses.map((card) => (
                  <Typography key={card.id} variant="caption">
                    {card.id}: {card.name}
                  </Typography>
                ))
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
