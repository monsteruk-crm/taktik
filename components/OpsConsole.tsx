import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import type { CardDefinition, ReactionWindow, TargetingSpec } from "@/lib/engine/gameState";
import CardArt from "@/lib/ui/CardArt";

type OpsConsoleProps = {
  commonDeckCount: number;
  pendingCard: CardDefinition | null;
  storedBonuses: CardDefinition[];
  tactics: CardDefinition[];
  openReactionWindows: ReactionWindow[];
  queuedTactic: { cardId: string; window: ReactionWindow; targets?: { unitIds?: string[] } } | null;
  queuedTacticCard: CardDefinition | null;
  tacticTargetingCard: CardDefinition | null;
  canStoreBonus: boolean;
  canPlayCard: boolean;
  canDrawCard: boolean;
  isPendingTargeting: boolean;
  isTacticTargeting: boolean;
  pendingTargetingSpec: TargetingSpec | null;
  tacticTargetingSpec: TargetingSpec | null;
  selectedTargetUnitIds: string[];
  logEntries: string[];
  logRef?: RefObject<HTMLDivElement | null>;
  logRowHeight?: number;
  onStoreBonus: () => void;
  onDrawCard: () => void;
  onStartPendingTargeting: () => void;
  onConfirmPendingTargets: () => void;
  onPlayPendingCard: () => void;
  onStartTacticTargeting: (cardId: string, window: ReactionWindow) => void;
  onQueueTactic: (cardId: string, window: ReactionWindow) => void;
  onConfirmTacticTargets: () => void;
  onCancelTargeting: () => void;
  onClearQueuedTactic: () => void;
};

const WINDOW_ORDER: ReactionWindow[] = [
  "beforeMove",
  "afterMove",
  "beforeAttackRoll",
  "afterAttackRoll",
  "beforeDamage",
];

const windowLabels: Record<ReactionWindow, string> = {
  beforeMove: "BEFORE MOVE",
  afterMove: "AFTER MOVE",
  beforeAttackRoll: "BEFORE ATTACK ROLL",
  afterAttackRoll: "AFTER ATTACK ROLL",
  beforeDamage: "BEFORE DAMAGE",
};

function TabPanel({
  children,
  active,
  index,
}: {
  children: ReactNode;
  active: number;
  index: number;
}) {
  return (
    <Box
      role="tabpanel"
      hidden={active !== index}
      sx={{
        flex: 1,
        minHeight: 0,
        display: active === index ? "flex" : "none",
        flexDirection: "column",
      }}
    >
      {active === index ? children : null}
    </Box>
  );
}

export default function OpsConsole({
  commonDeckCount,
  pendingCard,
  storedBonuses,
  tactics,
  openReactionWindows,
  queuedTactic,
  queuedTacticCard,
  tacticTargetingCard,
  canStoreBonus,
  canPlayCard,
  canDrawCard,
  isPendingTargeting,
  isTacticTargeting,
  pendingTargetingSpec,
  tacticTargetingSpec,
  selectedTargetUnitIds,
  logEntries,
  logRef,
  logRowHeight = 18,
  onStoreBonus,
  onDrawCard,
  onStartPendingTargeting,
  onConfirmPendingTargets,
  onPlayPendingCard,
  onStartTacticTargeting,
  onQueueTactic,
  onConfirmTacticTargets,
  onCancelTargeting,
  onClearQueuedTactic,
}: OpsConsoleProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const pendingTargetingLabel =
    pendingTargetingSpec?.type === "unit"
      ? `TARGET: ${pendingTargetingSpec.count} ${
          pendingTargetingSpec.owner === "self" ? "FRIENDLY" : "ENEMY"
        } UNIT(S)`
      : "TARGET: NONE";
  const disablePendingTargeting = isTacticTargeting;
  const disableTacticControls = isPendingTargeting;
  const groupedTactics = useMemo(() => {
    return WINDOW_ORDER.map((window) => ({
      window,
      cards: tactics.filter((card) => card.reactionWindow === window),
    })).filter((group) => group.cards.length > 0);
  }, [tactics]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (isPendingTargeting || isTacticTargeting) {
        onCancelTargeting();
      }
    }
    if (isPendingTargeting || isTacticTargeting) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    return undefined;
  }, [isPendingTargeting, isTacticTargeting, onCancelTargeting]);

  useEffect(() => {
    if (tabIndex === 2 && logRef?.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries.length, logRef, tabIndex]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "background.default",
      }}
    >
      <Tabs
        value={tabIndex}
        onChange={(_, value) => setTabIndex(value)}
        variant="fullWidth"
        sx={{
          borderBottom: "2px solid #1B1B1B",
          minHeight: 44,
        }}
      >
        <Tab label="CARDS" />
        <Tab label="TACTICS" />
        <Tab label="LOG" />
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <TabPanel active={tabIndex} index={0}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="caption" fontWeight={700}>
                  COMMON DECK: {commonDeckCount}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onDrawCard}
                  disabled={!canDrawCard}
                >
                  DRAW
                </Button>
              </Box>

              <Paper sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="caption" fontWeight={700}>
                    PENDING CARD
                  </Typography>
                  {pendingCard ? (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" },
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: { xs: "100%", sm: 140 },
                        }}
                      >
                        <CardArt card={pendingCard} label={`Art for ${pendingCard.name}`} maxWidth={140} />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          minHeight: 0,
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="caption" fontWeight={700}>
                          {pendingCard.kind.toUpperCase()}: {pendingCard.name}
                        </Typography>
                        <Typography variant="caption">SUMMARY: {pendingCard.summary}</Typography>
                        <Typography variant="caption">USAGE: {pendingCard.usage}</Typography>
                        <Typography variant="caption">{pendingTargetingLabel}</Typography>
                        {pendingTargetingSpec?.type === "unit" ? (
                          <Typography variant="caption">
                            SELECTED:{" "}
                            {selectedTargetUnitIds.length === 0
                              ? "NONE"
                              : selectedTargetUnitIds.join(", ")}
                          </Typography>
                        ) : null}
                        <Box
                          sx={{
                            mt: "auto",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            justifyContent: "flex-end",
                          }}
                        >
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
                            {pendingTargetingSpec?.type === "unit" ? "SELECT TARGETS" : "PLAY"}
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
                                CONFIRM
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={onCancelTargeting}
                                disabled={!isPendingTargeting}
                              >
                                CANCEL
                              </Button>
                            </>
                          ) : null}
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={onStoreBonus}
                            disabled={!canStoreBonus}
                          >
                            STORE
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="caption">NO PENDING CARD</Typography>
                  )}
                </Stack>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="caption" fontWeight={700}>
                    STORED BONUSES ({storedBonuses.length}/6)
                  </Typography>
                  {storedBonuses.length === 0 ? (
                    <Typography variant="caption">NONE</Typography>
                  ) : (
                    <Box
                      sx={{
                        display: { xs: "flex", md: "grid" },
                        gridTemplateColumns: {
                          md: "repeat(2, minmax(0, 1fr))",
                          lg: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 1,
                        overflowX: { xs: "auto", md: "visible" },
                        pb: 0.5,
                      }}
                    >
                      {storedBonuses.map((card) => (
                        <Accordion
                          key={card.id}
                          disableGutters
                          square
                          sx={{ minWidth: { xs: 160, md: "auto" } }}
                        >
                          <AccordionSummary
                            expandIcon={<Box sx={{ fontWeight: 700 }}>+</Box>}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 64, flexShrink: 0 }}>
                                <CardArt
                                  card={card}
                                  label={`Art for ${card.name}`}
                                  maxWidth={64}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight={700}>
                                {card.name}
                              </Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="caption">SUMMARY: {card.summary}</Typography>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </TabPanel>

        <TabPanel active={tabIndex} index={1}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
            <Stack spacing={2}>
              <Stack spacing={1}>
                <Typography variant="caption" fontWeight={700}>
                  OPEN WINDOWS
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {openReactionWindows.length === 0 ? (
                    <Chip label="NONE" variant="outlined" size="small" />
                  ) : (
                    openReactionWindows.map((window) => (
                      <Chip
                        key={window}
                        label={windowLabels[window] ?? window.toUpperCase()}
                        variant="outlined"
                        size="small"
                      />
                    ))
                  )}
                </Stack>
              </Stack>

              {queuedTacticCard ? (
                <Box
                  sx={{
                    border: "2px solid #1B1B1B",
                    bgcolor: "primary.main",
                    color: "background.default",
                    p: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={700}>
                      ARMED: {queuedTacticCard.name} ({queuedTactic?.window})
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={onClearQueuedTactic}
                      sx={{
                        borderColor: "background.default",
                        color: "background.default",
                        "&:hover": {
                          backgroundColor: "background.default",
                          color: "primary.main",
                          borderColor: "background.default",
                        },
                      }}
                    >
                      CLEAR
                    </Button>
                  </Stack>
                </Box>
              ) : null}

              {isTacticTargeting && tacticTargetingCard ? (
                <Paper sx={{ p: 1.5 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" fontWeight={700}>
                      TARGETING: {tacticTargetingCard.name}
                    </Typography>
                    {tacticTargetingSpec?.type === "unit" ? (
                      <Typography variant="caption">
                        SELECTED: {selectedTargetUnitIds.length}/{tacticTargetingSpec.count}
                      </Typography>
                    ) : null}
                  </Stack>
                </Paper>
              ) : null}

              {groupedTactics.length === 0 ? (
                <Typography variant="caption">NO TACTICS AVAILABLE.</Typography>
              ) : (
                groupedTactics.map((group) => (
                  <Stack key={group.window} spacing={1}>
                    <Typography variant="caption" fontWeight={700}>
                      WINDOW: {windowLabels[group.window]}
                    </Typography>
                    <Divider />
                    <Stack spacing={1}>
                      {group.cards.map((card) => {
                        const isWindowOpen = openReactionWindows.includes(group.window);
                        const isQueued = queuedTactic?.cardId === card.id;
                        const isTargetingThis =
                          isTacticTargeting && tacticTargetingCard?.id === card.id;
                        const canInteract =
                          isWindowOpen &&
                          !disableTacticControls &&
                          (!queuedTactic || isQueued) &&
                          (!isTacticTargeting || isTargetingThis);

                        return (
                          <Paper
                            key={card.id}
                            sx={{
                              p: 1.5,
                              opacity: canInteract ? 1 : 0.5,
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                              <Box sx={{ width: 72, flexShrink: 0 }}>
                                <CardArt
                                  card={card}
                                  label={`Art for ${card.name}`}
                                  maxWidth={72}
                                />
                              </Box>
                              <Stack spacing={0.5} flex={1}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography variant="caption" fontWeight={700}>
                                    {card.name}
                                  </Typography>
                                  <Chip label={windowLabels[group.window]} variant="outlined" size="small" />
                                </Stack>
                                <Typography variant="caption">SUMMARY: {card.summary}</Typography>
                                {card.targeting.type === "unit" ? (
                                  isTargetingThis ? (
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={onConfirmTacticTargets}
                                        disabled={
                                          !tacticTargetingSpec ||
                                          (tacticTargetingSpec.type === "unit" &&
                                            selectedTargetUnitIds.length !==
                                              tacticTargetingSpec.count)
                                        }
                                      >
                                        CONFIRM
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={onCancelTargeting}
                                      >
                                        CANCEL
                                      </Button>
                                    </Stack>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => {
                                        if (!card.reactionWindow) {
                                          return;
                                        }
                                        onStartTacticTargeting(card.id, card.reactionWindow);
                                      }}
                                      disabled={!canInteract || isTargetingThis}
                                    >
                                      SELECT TARGETS
                                    </Button>
                                  )
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
                                    {isQueued ? "ARMED" : "ARM"}
                                  </Button>
                                )}
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
          </Box>
        </TabPanel>

        <TabPanel active={tabIndex} index={2}>
          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="caption" fontWeight={700}>
                LOG
              </Typography>
              <Paper
                sx={{
                  p: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  ref={logRef}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {logEntries.length === 0 ? (
                    <Typography variant="caption">NO LOG ENTRIES.</Typography>
                  ) : (
                    logEntries.map((entry, index) => (
                      <Box
                        key={`${entry}-${index}`}
                        sx={{
                          minHeight: `${logRowHeight}px`,
                          lineHeight: `${logRowHeight}px`,
                          borderBottom: "1px solid rgba(27, 27, 27, 0.25)",
                          px: 0.5,
                        }}
                      >
                        <Typography variant="caption">{entry || " "}</Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Paper>
            </Stack>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}
