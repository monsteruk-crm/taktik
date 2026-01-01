import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import type { CardDefinition, ReactionWindow, TargetingSpec } from "@/lib/engine/gameState";
import CardArt from "@/lib/ui/CardArt";
import TacticsModal from "@/lib/ui/TacticsModal";

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
  const [isTacticsModalOpen, setIsTacticsModalOpen] = useState(false);
  const pendingTargetingLabel =
    pendingTargetingSpec?.type === "unit"
      ? `Target: ${pendingTargetingSpec.count} ${pendingTargetingSpec.owner === "self" ? "friendly" : "enemy"} unit(s)`
      : "Target: none";
  const openWindowsLabel =
    openReactionWindows.length > 0 ? openReactionWindows.join(", ") : "None";
  const disablePendingTargeting = isTacticTargeting;
  const disableTacticControls = isPendingTargeting;
  const playableTacticsCount = useMemo(() => {
    return tactics.filter((card) => {
      const window = card.reactionWindow;
      if (!window) {
        return false;
      }
      if (!openReactionWindows.includes(window)) {
        return false;
      }
      if (disableTacticControls) {
        return false;
      }
      if (queuedTactic && queuedTactic.cardId !== card.id) {
        return false;
      }
      if (isTacticTargeting && tacticTargetingCard?.id !== card.id) {
        return false;
      }
      return true;
    }).length;
  }, [
    tactics,
    openReactionWindows,
    disableTacticControls,
    queuedTactic,
    isTacticTargeting,
    tacticTargetingCard,
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (isPendingTargeting || isTacticTargeting) {
        onCancelTargeting();
        return;
      }
      if (isTacticsModalOpen) {
        setIsTacticsModalOpen(false);
      }
    }
    if (isPendingTargeting || isTacticTargeting || isTacticsModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    return undefined;
  }, [isPendingTargeting, isTacticTargeting, isTacticsModalOpen, onCancelTargeting]);

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
              Tactics
            </Typography>
            <Typography variant="caption">Open windows: {openWindowsLabel}</Typography>
            <Box>
              <Badge
                color="error"
                badgeContent={playableTacticsCount}
                invisible={playableTacticsCount === 0}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsTacticsModalOpen(true)}
                  disabled={openReactionWindows.length === 0}
                >
                  TACTICS
                </Button>
              </Badge>
            </Box>
            {queuedTacticCard ? (
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  ARMED: {queuedTacticCard.name} ({queuedTactic?.window})
                </Typography>
                <Button variant="outlined" size="small" onClick={onClearQueuedTactic}>
                  Clear
                </Button>
              </Stack>
            ) : null}
            {isTacticTargeting && tacticTargetingCard ? (
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  Selecting targets for {tacticTargetingCard.name}
                </Typography>
                {tacticTargetingSpec?.type === "unit" ? (
                  <Typography variant="caption">
                    Selected:{" "}
                    {selectedTargetUnitIds.length === 0
                      ? "None"
                      : selectedTargetUnitIds.join(", ")}
                  </Typography>
                ) : null}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onConfirmTacticTargets}
                    disabled={
                      !tacticTargetingSpec ||
                      selectedTargetUnitIds.length !== tacticTargetingSpec.count
                    }
                  >
                    Confirm
                  </Button>
                  <Button variant="outlined" size="small" onClick={onCancelTargeting}>
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
      <TacticsModal
        open={isTacticsModalOpen}
        tactics={tactics}
        openReactionWindows={openReactionWindows}
        queuedTactic={queuedTactic}
        isPendingTargeting={isPendingTargeting}
        isTacticTargeting={isTacticTargeting}
        tacticTargetingCard={tacticTargetingCard}
        onClose={() => setIsTacticsModalOpen(false)}
        onStartTacticTargeting={onStartTacticTargeting}
        onQueueTactic={onQueueTactic}
      />
    </Paper>
  );
}
