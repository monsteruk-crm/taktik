import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CardDefinition, ReactionWindow, TargetingSpec } from "@/lib/engine/gameState";

type CardPanelProps = {
  commonDeckCount: number;
  pendingCard: CardDefinition | null;
  storedBonuses: CardDefinition[];
  tactics: CardDefinition[];
  openReactionWindows: ReactionWindow[];
  queuedTactic: { cardId: string; window: ReactionWindow; targets?: { unitIds?: string[] } } | null;
  queuedTacticCard: CardDefinition | null;
  tacticTargetingCard: CardDefinition | null;
  canDrawCard: boolean;
  canStoreBonus: boolean;
  canPlayCard: boolean;
  isPendingTargeting: boolean;
  isTacticTargeting: boolean;
  pendingTargetingSpec: TargetingSpec | null;
  tacticTargetingSpec: TargetingSpec | null;
  selectedTargetUnitIds: string[];
  onDrawCard: () => void;
  onStoreBonus: () => void;
  onStartPendingTargeting: () => void;
  onConfirmPendingTargets: () => void;
  onPlayPendingCard: () => void;
  onStartTacticTargeting: (cardId: string, window: ReactionWindow) => void;
  onQueueTactic: (cardId: string, window: ReactionWindow) => void;
  onConfirmTacticTargets: () => void;
  onCancelTargeting: () => void;
  onClearQueuedTactic: () => void;
};

const fallbackCardImage = "/assets/cards/placeholder.png";

function CardArt({ card, label }: { card: CardDefinition; label: string }) {
  const src = card.images?.lo ?? fallbackCardImage;
  return (
    <Box
      component="img"
      alt={label}
      src={src}
      sx={{
        width: "100%",
        maxWidth: 180,
        border: "1px solid #000",
        borderRadius: 1,
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

export default function CardPanel({
  commonDeckCount,
  pendingCard,
  storedBonuses,
  tactics,
  openReactionWindows,
  queuedTactic,
  queuedTacticCard,
  tacticTargetingCard,
  canDrawCard,
  canStoreBonus,
  canPlayCard,
  isPendingTargeting,
  isTacticTargeting,
  pendingTargetingSpec,
  tacticTargetingSpec,
  selectedTargetUnitIds,
  onDrawCard,
  onStoreBonus,
  onStartPendingTargeting,
  onConfirmPendingTargets,
  onPlayPendingCard,
  onStartTacticTargeting,
  onQueueTactic,
  onConfirmTacticTargets,
  onCancelTargeting,
  onClearQueuedTactic,
}: CardPanelProps) {
  const pendingTargetingLabel =
    pendingTargetingSpec?.type === "unit"
      ? `Target: ${pendingTargetingSpec.count} ${pendingTargetingSpec.owner === "self" ? "friendly" : "enemy"} unit(s)`
      : "Target: none";
  const openWindowsLabel =
    openReactionWindows.length > 0 ? openReactionWindows.join(", ") : "None";
  const disablePendingTargeting = isTacticTargeting;
  const disableTacticControls = isPendingTargeting;

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
                <CardArt card={pendingCard} label={`Art for ${pendingCard.name}`} />
                <Typography variant="caption">
                  {pendingCard.kind}: {pendingCard.name}
                </Typography>
                <Typography variant="caption">Summary: {pendingCard.summary}</Typography>
                <Typography variant="caption">Usage: {pendingCard.usage}</Typography>
                <Typography variant="caption">{pendingTargetingLabel}</Typography>
                {pendingTargetingSpec?.type === "unit" ? (
                  <Stack spacing={0.25}>
                    <Typography variant="caption">
                      Selected:{" "}
                      {selectedTargetUnitIds.length === 0
                        ? "None"
                        : selectedTargetUnitIds.join(", ")}
                    </Typography>
                    {isPendingTargeting ? (
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
                onClick={
                  pendingTargetingSpec?.type === "unit"
                    ? onStartPendingTargeting
                    : onPlayPendingCard
                }
                disabled={
                  !canPlayCard ||
                  disablePendingTargeting ||
                  (pendingTargetingSpec?.type === "unit" && isPendingTargeting)
                }
              >
                {pendingTargetingSpec?.type === "unit" ? "Select Targets" : "Play Card"}
              </Button>
              {pendingTargetingSpec?.type === "unit" ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onConfirmPendingTargets}
                    disabled={
                      !canPlayCard ||
                      !isPendingTargeting ||
                      selectedTargetUnitIds.length !== pendingTargetingSpec.count
                    }
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onCancelTargeting}
                    disabled={!isPendingTargeting}
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
                  <Stack key={card.id} spacing={0.25}>
                    <CardArt card={card} label={`Art for ${card.name}`} />
                    <Typography variant="caption">
                      {card.id}: {card.name}
                    </Typography>
                    <Typography variant="caption">Summary: {card.summary}</Typography>
                    <Typography variant="caption">Usage: {card.usage}</Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderColor: "#000" }}>
          <Stack spacing={1}>
            <Typography variant="caption" fontWeight={600}>
              Tactics ({tactics.length})
            </Typography>
            <Typography variant="caption">Open windows: {openWindowsLabel}</Typography>
            {queuedTacticCard ? (
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  Armed tactic: {queuedTacticCard.name} ({queuedTactic?.window})
                </Typography>
                <Button variant="outlined" size="small" onClick={onClearQueuedTactic}>
                  Clear Armed Tactic
                </Button>
              </Stack>
            ) : null}
            <Stack spacing={1}>
              {tactics.length === 0 ? (
                <Typography variant="caption">None</Typography>
              ) : (
                tactics.map((card) => {
                  const window = card.reactionWindow ?? "unknown";
                  const isWindowOpen =
                    !!card.reactionWindow && openReactionWindows.includes(card.reactionWindow);
                  const isQueued = queuedTactic?.cardId === card.id;
                  const isTargetingThis =
                    isTacticTargeting && tacticTargetingCard?.id === card.id;
                  const canArm =
                    isWindowOpen &&
                    !disableTacticControls &&
                    (!queuedTactic || isQueued);
                  return (
                    <Stack key={card.id} spacing={0.25}>
                      <CardArt card={card} label={`Art for ${card.name}`} />
                      <Typography variant="caption">
                        {card.id}: {card.name}
                      </Typography>
                      <Typography variant="caption">Window: {window}</Typography>
                      <Typography variant="caption">Summary: {card.summary}</Typography>
                      <Typography variant="caption">Usage: {card.usage}</Typography>
                      {isTargetingThis && tacticTargetingSpec?.type === "unit" ? (
                        <Stack spacing={0.25}>
                          <Typography variant="caption">
                            Selected:{" "}
                            {selectedTargetUnitIds.length === 0
                              ? "None"
                              : selectedTargetUnitIds.join(", ")}
                          </Typography>
                          <Typography variant="caption">
                            Click units on the map to select targets.
                          </Typography>
                        </Stack>
                      ) : null}
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {card.targeting.type === "unit" ? (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                card.reactionWindow &&
                                onStartTacticTargeting(card.id, card.reactionWindow)
                              }
                              disabled={!canArm || isTargetingThis}
                            >
                              Select Targets
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={onConfirmTacticTargets}
                              disabled={
                                !isTargetingThis ||
                                !canArm ||
                                !tacticTargetingSpec ||
                                selectedTargetUnitIds.length !== tacticTargetingSpec.count
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={onCancelTargeting}
                              disabled={!isTargetingThis}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              card.reactionWindow && onQueueTactic(card.id, card.reactionWindow)
                            }
                            disabled={!canArm || isQueued}
                          >
                            {isQueued ? "Armed" : "Arm Tactic"}
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  );
                })
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
