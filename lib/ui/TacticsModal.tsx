import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { CardDefinition, ReactionWindow } from "@/lib/engine/gameState";
import CardArt from "@/lib/ui/CardArt";

type TacticsModalProps = {
  open: boolean;
  tactics: CardDefinition[];
  openReactionWindows: ReactionWindow[];
  queuedTactic: { cardId: string; window: ReactionWindow } | null;
  isPendingTargeting: boolean;
  isTacticTargeting: boolean;
  tacticTargetingCard: CardDefinition | null;
  onClose: () => void;
  onStartTacticTargeting: (cardId: string, window: ReactionWindow) => void;
  onQueueTactic: (cardId: string, window: ReactionWindow) => void;
};

const WINDOW_ORDER: ReactionWindow[] = [
  "beforeMove",
  "afterMove",
  "beforeAttackRoll",
  "afterAttackRoll",
  "beforeDamage",
];

const windowLabels: Record<ReactionWindow, string> = {
  beforeMove: "beforeMove",
  afterMove: "afterMove",
  beforeAttackRoll: "beforeAttackRoll",
  afterAttackRoll: "afterAttackRoll",
  beforeDamage: "beforeDamage",
};

function TacticsModalContent({
  tactics,
  openReactionWindows,
  queuedTactic,
  isPendingTargeting,
  isTacticTargeting,
  tacticTargetingCard,
  onClose,
  onStartTacticTargeting,
  onQueueTactic,
}: Omit<TacticsModalProps, "open">) {
  const grouped = WINDOW_ORDER.map((window) => ({
    window,
    cards: tactics.filter((card) => card.reactionWindow === window),
  })).filter((group) => group.cards.length > 0);

  return (
    <Stack spacing={2}>
      {grouped.length === 0 ? (
        <Typography variant="body2">No tactics available.</Typography>
      ) : (
        grouped.map((group) => (
          <Stack key={group.window} spacing={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              Window: {windowLabels[group.window]}
            </Typography>
            <Divider sx={{ borderColor: "#000" }} />
            <Stack spacing={1}>
              {group.cards.map((card) => {
                const isWindowOpen = openReactionWindows.includes(group.window);
                const isQueued = queuedTactic?.cardId === card.id;
                const isTargetingThis =
                  isTacticTargeting && tacticTargetingCard?.id === card.id;
                const canInteract =
                  isWindowOpen &&
                  !isPendingTargeting &&
                  (!queuedTactic || isQueued) &&
                  (!isTacticTargeting || isTargetingThis);

                return (
                  <Paper
                    key={card.id}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderColor: "#000",
                      opacity: canInteract ? 1 : 0.5,
                    }}
                  >
                    <Stack spacing={1} direction={{ xs: "column", sm: "row" }}>
                      <Box sx={{ width: 120, flexShrink: 0 }}>
                        <CardArt card={card} label={`Art for ${card.name}`} maxWidth={120} />
                      </Box>
                      <Stack spacing={0.5} flex={1}>
                        <Typography variant="caption" fontWeight={600}>
                          {card.name}
                        </Typography>
                        <Typography variant="caption">Summary: {card.summary}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {card.targeting.type === "unit" ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                if (!card.reactionWindow) {
                                  return;
                                }
                                onStartTacticTargeting(card.id, card.reactionWindow);
                                onClose();
                              }}
                              disabled={!canInteract || isTargetingThis}
                            >
                              Select Targets
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                card.reactionWindow &&
                                onQueueTactic(card.id, card.reactionWindow)
                              }
                              disabled={!canInteract || isQueued}
                            >
                              {isQueued ? "Armed" : "Arm"}
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        ))
      )}
    </Stack>
  );
}

export default function TacticsModal(props: TacticsModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const content = (
    <TacticsModalContent
      tactics={props.tactics}
      openReactionWindows={props.openReactionWindows}
      queuedTactic={props.queuedTactic}
      isPendingTargeting={props.isPendingTargeting}
      isTacticTargeting={props.isTacticTargeting}
      tacticTargetingCard={props.tacticTargetingCard}
      onClose={props.onClose}
      onStartTacticTargeting={props.onStartTacticTargeting}
      onQueueTactic={props.onQueueTactic}
    />
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={props.open}
        onClose={props.onClose}
        PaperProps={{
          sx: { borderTop: "2px solid #000", px: 2, py: 2 },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Tactics
          </Typography>
          {content}
        </Stack>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { border: "2px solid #000" } }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid #000" }}>Tactics</DialogTitle>
      <DialogContent sx={{ py: 2 }}>{content}</DialogContent>
    </Dialog>
  );
}
