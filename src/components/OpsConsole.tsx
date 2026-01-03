import type {ReactNode, RefObject} from "react";
import {useEffect, useMemo, useState} from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type {CardDefinition, ReactionWindow, TargetingSpec} from "@/lib/engine/gameState";
import CardArt from "@/lib/ui/CardArt";
import Frame from "@/components/ui/Frame";
import Plate from "@/components/ui/Plate";
import ObliqueKey from "@/components/ui/ObliqueKey";
import ObliqueTabBar from "@/components/ui/ObliqueTabBar";
import {DUR, EASE, useReducedMotion} from "@/lib/ui/motion";
import { semanticColors } from "@/lib/ui/semanticColors";
import BandHeader from "@/components/ui/BandHeader";

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
    activePlayer: string;
    turn: number;
    isPendingTargeting: boolean;
    isTacticTargeting: boolean;
    pendingTargetingSpec: TargetingSpec | null;
    tacticTargetingSpec: TargetingSpec | null;
    selectedTargetUnitIds: string[];
    logEntries: string[];
    logRef?: RefObject<HTMLDivElement | null>;
    logRowHeight?: number;
    fillHeight?: boolean;
    scrollMode?: "panel" | "body";
    activeTab?: "cards" | "tactics" | "log";
    onTabChange?: (tab: "cards" | "tactics" | "log") => void;
    showHeader?: boolean;
    showTabs?: boolean;
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

const SHOW_DEV_LOGS = process.env.NEXT_PUBLIC_SHOW_DEV_LOGS === "true";

function TabPanel({
    children,
    activeId,
    id,
}: {
    children: ReactNode;
    activeId: string;
    id: string;
}) {
  return (
    <Box
      role="tabpanel"
      hidden={activeId !== id}
      sx={{
        flex: 1,
        minHeight: 0,
        display: activeId === id ? "flex" : "none",
        flexDirection: "column",
      }}
    >
      {activeId === id ? children : null}
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
                                       activePlayer,
                                       turn,
                                       isPendingTargeting,
                                       isTacticTargeting,
                                       pendingTargetingSpec,
                                       tacticTargetingSpec,
                                       selectedTargetUnitIds,
                                       logEntries,
                                       logRef,
                                       logRowHeight = 18,
                                       fillHeight = true,
                                       scrollMode = "panel",
                                       activeTab,
                                       onTabChange,
                                       showHeader = true,
                                       showTabs = true,
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
    const [internalTab, setInternalTab] = useState<"cards" | "tactics" | "log">("cards");
    const resolvedTab = activeTab ?? internalTab;
    const setTab = onTabChange ?? setInternalTab;
    const [expandedBonusId, setExpandedBonusId] = useState<string | null>(null);
    const reducedMotion = useReducedMotion();
    const useBodyScroll = scrollMode === "body";
    const pendingTargetingLabel =
        pendingTargetingSpec?.type === "unit"
            ? `TARGET: ${pendingTargetingSpec.count} ${
                pendingTargetingSpec.owner === "self" ? "FRIENDLY" : "ENEMY"
            } UNIT(S)`
            : "TARGET: NONE";
    const disablePendingTargeting = isTacticTargeting;
    const disableTacticControls = isPendingTargeting;
    const playerStripe =
        activePlayer === "PLAYER_A" ? semanticColors.playerA : semanticColors.playerB;
    const pendingCardStripe = pendingCard
        ? pendingCard.kind === "bonus"
            ? semanticColors.move
            : pendingCard.kind === "malus"
                ? semanticColors.attack
                : semanticColors.dice
        : semanticColors.neutralStripe;
  const groupedTactics = useMemo(() => {
    return WINDOW_ORDER.map((window) => ({
      window,
      cards: tactics.filter((card) => card.reactionWindow === window),
    })).filter((group) => group.cards.length > 0);
  }, [tactics]);

  useEffect(() => {
    if (!SHOW_DEV_LOGS && resolvedTab === "log") {
      setTab("cards");
    }
  }, [resolvedTab, setTab]);

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
    if (!useBodyScroll && resolvedTab === "log" && logRef?.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [resolvedTab, logEntries.length, logRef, useBodyScroll]);

    return (
            <Box
                sx={{
                height: fillHeight ? "100%" : "auto",
                display: "flex",
                flexDirection: "column",
                minHeight: fillHeight ? 0 : "auto",
                flex: fillHeight ? 1 : "0 0 auto",
                bgcolor: "var(--panel)",
                overflowX: "hidden",
            }}
        >
            {showHeader ? (
                <Box sx={{px: 2, pt: 2, pb: 1}}>
                    <BandHeader
                        titleLeft="TAKTIK COMMAND"
                        titleRight={`PLAYER: ${activePlayer} • TURN: ${turn}`}
                        accentColor={playerStripe}
                    />
                </Box>
            ) : null}

            {showTabs ? (
                <Box sx={{px: 2, pb: 1}}>
                    <ObliqueTabBar
                        tabs={[
                            {id: "cards", label: "CARDS"},
                            {id: "tactics", label: "TACTICS"},
                            {id: "log", label: "LOG", hidden: !SHOW_DEV_LOGS},
                        ]}
                        activeId={resolvedTab}
                        onChange={(id) => setTab(id as "cards" | "tactics" | "log")}
                        size="md"
                    />
                    <Box sx={{borderBottom: "2px solid #1B1B1B", mt: 0.5}}/>
                </Box>
            ) : null}

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: useBodyScroll ? "visible" : "hidden",
                    px: useBodyScroll ? 0 : 2,
                    pb: useBodyScroll ? 1.5 : 2,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <TabPanel activeId={resolvedTab} id="cards">
                    <Box
                        sx={{
                            flex: useBodyScroll ? "0 0 auto" : 1,
                            minHeight: useBodyScroll ? "auto" : 0,
                            overflow: useBodyScroll ? "visible" : "auto",
                        }}
                    >
                        <Stack spacing={2}>
                            <Plate sx={{justifyContent: "space-between", width: "100%"}}>
                                <Typography variant="caption" fontWeight={700}>
                                    COMMON DECK: {commonDeckCount}
                                </Typography>
                                <ObliqueKey
                                    label="DRAW"
                                    onClick={onDrawCard}
                                    disabled={!canDrawCard}
                                    tone="neutral"
                                    size="sm"
                                />
                            </Plate>

                            <Frame
                                titleLeft="PENDING CARD DIRECTIVE"
                                accentColor={pendingCardStripe}
                                headerVariant="band"
                                contentSx={{backgroundColor: "var(--action-panel)"}}
                            >
                                {pendingCard ? (
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {xs: "1fr", sm: "140px 1fr"},
                                            gap: 2,
                                            alignItems: "start",
                                        }}
                                    >
                                        <Box sx={{maxWidth: {xs: "100%", sm: 140}}}>
                                            <CardArt
                                                card={pendingCard}
                                                label={`Art for ${pendingCard.name}`}
                                                maxWidth={140}
                                            />
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                minHeight: 0,
                                                gap: 0.75,
                                            }}
                                        >
                                            <Typography variant="caption" fontWeight={700}>
                                                {pendingCard.kind.toUpperCase()}: {pendingCard.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    letterSpacing: "0.02em",
                                                    lineHeight: 1.3,
                                                    color: semanticColors.ink,
                                                }}
                                            >
                                                SUMMARY: {pendingCard.summary}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    letterSpacing: "0.02em",
                                                    lineHeight: 1.3,
                                                    color: semanticColors.ink,
                                                }}
                                            >
                                                USAGE: {pendingCard.usage}
                                            </Typography>
                                            <Plate sx={{py: 0.25, px: 1, width: "fit-content"}}>
                                                <Typography variant="caption">{pendingTargetingLabel}</Typography>
                                            </Plate>
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
                            <ObliqueKey
                                label={pendingTargetingSpec?.type === "unit" ? "SELECT TARGETS" : "PLAY"}
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
                                tone={pendingTargetingSpec?.type === "unit" ? "yellow" : "black"}
                                active
                                size="sm"
                            />
                            {pendingTargetingSpec?.type === "unit" ? (
                                <>
                                    <ObliqueKey
                                        label="CONFIRM"
                                        onClick={onConfirmPendingTargets}
                                        disabled={
                                            !canPlayCard ||
                                            !isPendingTargeting ||
                                            selectedTargetUnitIds.length !== pendingTargetingSpec.count
                                        }
                                        tone="black"
                                        active
                                        size="sm"
                                    />
                                    <ObliqueKey
                                        label="CANCEL"
                                        onClick={onCancelTargeting}
                                        disabled={!isPendingTargeting}
                                        tone="neutral"
                                        active
                                        size="sm"
                                    />
                                </>
                            ) : null}
                            <ObliqueKey
                                label="STORE"
                                onClick={onStoreBonus}
                                disabled={!canStoreBonus}
                                tone="neutral"
                                size="sm"
                            />
                        </Box>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="caption">NO PENDING CARD</Typography>
                                )}
                            </Frame>

                            <Frame
                                titleLeft="STORED BONUSES"
                                titleRight={`${storedBonuses.length}/6`}
                                accentColor="#8A8F94"
                                headerVariant="band"
                                contentSx={{backgroundColor: "var(--action-panel)"}}
                            >
                                {storedBonuses.length === 0 ? (
                                    <Typography variant="caption">NONE</Typography>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "minmax(0, 1fr)",
                                                sm: "repeat(2, minmax(0, 1fr))",
                                            },
                                            gap: 1,
                                        }}
                                    >
                                        {storedBonuses.map((card) => {
                                            const isExpanded = expandedBonusId === card.id;
                                            return (
                                                <Box key={card.id}>
                                                    <Plate
                                                        component="button"
                                                        onClick={() =>
                                                            setExpandedBonusId(isExpanded ? null : card.id)
                                                        }
                                                        sx={{
                                                            width: "100%",
                                                            justifyContent: "flex-start",
                                                            textAlign: "left",
                                                            gap: 1,
                                                            px: 1,
                                                            py: 0.75,
                                                            cursor: "pointer",
                                                            textTransform: "none",
                                                            letterSpacing: "0.04em",
                                                            "&:active": {
                                                                transform: "translateY(1px)",
                                                            },
                                                            "&:focus-visible": {
                                                                outline: "2px solid #1F4E79",
                                                                outlineOffset: 2,
                                                            },
                                                            "@media (prefers-reduced-motion: reduce)": {
                                                                "&:active": {
                                                                    transform: "none",
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <Box sx={{width: 56, flexShrink: 0}}>
                                                            <CardArt
                                                                card={card}
                                                                label={`Art for ${card.name}`}
                                                                maxWidth={56}
                                                            />
                                                        </Box>
                                                        <Typography
                                                            variant="caption"
                                                            fontWeight={700}
                                                            sx={{
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: "vertical",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            {card.name}
                                                        </Typography>
                                                    </Plate>
                        <Collapse
                          in={isExpanded}
                          timeout={reducedMotion ? 0 : DUR.standard}
                          easing={EASE.stiff}
                        >
                                                        <Box
                                                            sx={{
                                                                border: "1px solid rgba(27, 27, 27, 0.35)",
                                                                borderTop: 0,
                                                                p: 1,
                                                                backgroundColor: "var(--panel)",
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    letterSpacing: "0.02em",
                                                                    lineHeight: 1.3,
                                                                    color: semanticColors.ink,
                                                                }}
                                                            >
                                                                SUMMARY: {card.summary}
                                                            </Typography>
                                                        </Box>
                                                    </Collapse>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Frame>
                        </Stack>
                    </Box>
                </TabPanel>

                <TabPanel activeId={resolvedTab} id="tactics">
                    <Box
                        sx={{
                            flex: useBodyScroll ? "0 0 auto" : 1,
                            minHeight: useBodyScroll ? "auto" : 0,
                            overflow: useBodyScroll ? "visible" : "auto",
                        }}
                    >
                        <Stack spacing={2}>
                            <Frame
                                titleLeft="OPEN WINDOWS"
                                headerVariant="band"
                                accentColor={semanticColors.neutralStripe}
                                contentSx={{backgroundColor: "var(--action-panel)"}}
                            >
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {openReactionWindows.length === 0 ? (
                                        <Chip label="NONE" variant="outlined" size="small"/>
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
                            </Frame>

                            {queuedTacticCard ? (
                                <Plate
                                    accentColor="#1F4E79"
                                    sx={{
                                        backgroundColor: "#1F4E79",
                                        color: "#E6E6E2",
                                        borderColor: "#1B1B1B",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            width: "100%",
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700}>
                                            ARMED: {queuedTacticCard.name} ({queuedTactic?.window})
                                        </Typography>
                    <ObliqueKey
                      label="CLEAR"
                      onClick={onClearQueuedTactic}
                      tone="black"
                      size="sm"
                      accentColor="#E6E6E2"
                    />
                                    </Box>
                                </Plate>
                            ) : null}

                            {isTacticTargeting && tacticTargetingCard ? (
                                <Frame
                                    titleLeft="TACTIC TARGETING"
                                    accentColor="#F2B705"
                                    headerVariant="band"
                                    contentSx={{backgroundColor: "var(--action-panel)"}}
                                >
                                    <Stack spacing={0.5}>
                                        <Typography variant="caption" fontWeight={700}>
                                            {tacticTargetingCard.name}
                                        </Typography>
                                        {tacticTargetingSpec?.type === "unit" ? (
                                            <Typography variant="caption">
                                                SELECTED: {selectedTargetUnitIds.length}/{tacticTargetingSpec.count}
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                </Frame>
                            ) : null}

                            {groupedTactics.length === 0 ? (
                                <Typography variant="caption">NO TACTICS AVAILABLE.</Typography>
                            ) : (
                                groupedTactics.map((group) => (
                                    <Frame
                                        key={group.window}
                                        titleLeft={`WINDOW: ${windowLabels[group.window]}`}
                                        accentColor="#8A8F94"
                                        headerVariant="band"
                                        contentSx={{backgroundColor: "var(--action-panel)"}}
                                    >
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
                                                    <Box
                                                        key={card.id}
                                                        sx={{
                                                            border: "2px solid #1B1B1B",
                                                            p: 1.5,
                                                            opacity: canInteract ? 1 : 0.35,
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                                            <Box sx={{width: 72, flexShrink: 0}}>
                                                                <CardArt
                                                                    card={card}
                                                                    label={`Art for ${card.name}`}
                                                                    maxWidth={72}
                                                                />
                                                            </Box>
                                                            <Stack spacing={0.5} flex={1}>
                                                                <Stack direction="row" spacing={1} alignItems="center"
                                                                       flexWrap="wrap">
                                                                    <Typography variant="caption" fontWeight={700}>
                                                                        {card.name}
                                                                    </Typography>
                                                                    <Plate sx={{py: 0.25, px: 1}}>
                                                                        <Typography variant="caption">
                                                                            {windowLabels[group.window]}
                                                                        </Typography>
                                                                    </Plate>
                                                                </Stack>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{
                                                                        letterSpacing: "0.02em",
                                                                        lineHeight: 1.3,
                                                                        color: semanticColors.ink,
                                                                    }}
                                                                >
                                                                    SUMMARY: {card.summary}
                                                                </Typography>
                                                                {card.targeting.type === "unit" ? (
                                                                    isTargetingThis ? (
                                                                        <Stack direction="row" spacing={1}
                                                                               flexWrap="wrap">
                                      <ObliqueKey
                                        label="CONFIRM"
                                        onClick={onConfirmTacticTargets}
                                        disabled={
                                          !tacticTargetingSpec ||
                                          (tacticTargetingSpec.type === "unit" &&
                                            selectedTargetUnitIds.length !==
                                              tacticTargetingSpec.count)
                                        }
                                        tone="black"
                                        active
                                        size="sm"
                                      />
                                      <ObliqueKey
                                        label="CANCEL"
                                        onClick={onCancelTargeting}
                                        tone="neutral"
                                        active
                                        size="sm"
                                      />
                                    </Stack>
                                  ) : (
                                    <ObliqueKey
                                      label="SELECT TARGETS"
                                      onClick={() => {
                                        if (!card.reactionWindow) {
                                          return;
                                        }
                                        onStartTacticTargeting(card.id, card.reactionWindow);
                                      }}
                                      disabled={!canInteract || isTargetingThis}
                                      tone="yellow"
                                      active
                                      size="sm"
                                    />
                                  )
                                ) : (
                                  <ObliqueKey
                                    label={isQueued ? "ARMED" : "ARM"}
                                    onClick={() =>
                                      card.reactionWindow &&
                                      onQueueTactic(card.id, card.reactionWindow)
                                    }
                                    disabled={!canInteract || isQueued}
                                    tone="neutral"
                                    size="sm"
                                  />
                                )}
                                                            </Stack>
                                                        </Stack>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Frame>
                                ))
                            )}
                        </Stack>
                    </Box>
                </TabPanel>

                {SHOW_DEV_LOGS ? (
                    <TabPanel activeId={resolvedTab} id="log">
                        <Frame
                            titleLeft="BATTLE LOG"
                            accentColor="#1B1B1B"
                            headerVariant="band"
                            contentSx={{gap: 1, backgroundColor: "var(--action-panel)"}}
                            sx={{flex: 1, minHeight: 0}}
                        >
                            <Box
                                ref={logRef}
                                sx={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: useBodyScroll ? "visible" : "auto",
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
                                                borderBottom: "2px solid rgba(27, 27, 27, 0.25)",
                                                px: 0.5,
                                            }}
                                        >
                                            <Typography variant="caption">{entry || " "}</Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Frame>
                    </TabPanel>
                ) : null}
            </Box>
        </Box>
    );
}
