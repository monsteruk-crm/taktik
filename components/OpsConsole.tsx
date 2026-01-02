import type {ReactNode, RefObject} from "react";
import {useEffect, useMemo, useState} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import type {CardDefinition, ReactionWindow, TargetingSpec} from "@/lib/engine/gameState";
import CardArt from "@/lib/ui/CardArt";
import Frame from "@/components/ui/Frame";
import Plate from "@/components/ui/Plate";

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
    const [expandedBonusId, setExpandedBonusId] = useState<string | null>(null);
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
                height: fillHeight ? "100%" : "auto",
                display: "flex",
                flexDirection: "column",
                minHeight: fillHeight ? 0 : "auto",
                flex: fillHeight ? 1 : "0 0 auto",
                bgcolor: "background.default",
                overflowX: "hidden",
            }}
        >
            <Box sx={{px: 2, pt: 2, pb: 1}}>
                <Plate accentColor="#1F4E79" sx={{width: "100%", px: 2, py: 1}}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <Typography variant="caption" fontWeight={700}>
                            TAKTIK COMMAND
                        </Typography>
                        <Typography variant="caption">
                            PLAYER: {activePlayer} • TURN: {turn}
                        </Typography>
                    </Box>
                </Plate>
            </Box>

            <Box sx={{px: 2, pb: 1}}>
                <Tabs
                    value={tabIndex}
                    onChange={(_, value) => setTabIndex(value)}
                    variant="fullWidth"
                    slotProps={{
                        indicator: {
                            sx: {display: "none"}
                        }
                    }}
                    sx={{
                        minHeight: 44,
                        gap: 1,
                    }}
                >
                    {["CARDS", "TACTICS", "LOG"].map((label) => (
                        <Tab
                            key={label}
                            label={label}
                            sx={{
                                border: "2px solid #1B1B1B",
                                minHeight: 44,
                                backgroundColor: "#E6E6E2",
                                color: "#1B1B1B",
                                letterSpacing: "0.08em",
                                fontWeight: 700,
                                "&.Mui-selected": {
                                    backgroundColor: "#1B1B1B",
                                    color: "#E6E6E2",
                                },
                            }}
                        />
                    ))}
                </Tabs>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    px: 2,
                    pb: 2,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <TabPanel active={tabIndex} index={0}>
                    <Box sx={{flex: 1, minHeight: 0, overflow: "auto"}}>
                        <Stack spacing={2}>
                            <Plate sx={{justifyContent: "space-between", width: "100%"}}>
                                <Typography variant="caption" fontWeight={700}>
                                    COMMON DECK: {commonDeckCount}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={onDrawCard}
                                    disabled={!canDrawCard}
                                    sx={{
                                        border: "2px solid #1B1B1B",
                                        backgroundColor: "#E6E6E2",
                                        color: "#1B1B1B",
                                        "&:hover": {
                                            backgroundColor: "#1B1B1B",
                                            color: "#E6E6E2",
                                        },
                                        "&.Mui-disabled": {
                                            opacity: 0.35,
                                            backgroundColor: "#E6E6E2",
                                            color: "#1B1B1B",
                                        },
                                    }}
                                >
                                    DRAW
                                </Button>
                            </Plate>

                            <Frame titleLeft="PENDING CARD DIRECTIVE" accentColor="#1F4E79">
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
                            </Frame>

                            <Frame
                                titleLeft="STORED BONUSES"
                                titleRight={`${storedBonuses.length}/6`}
                                accentColor="#8A8F94"
                            >
                                {storedBonuses.length === 0 ? (
                                    <Typography variant="caption">NONE</Typography>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridAutoFlow: {xs: "column", md: "row"},
                                            gridTemplateColumns: {md: "repeat(2, minmax(0, 1fr))"},
                                            gridAutoColumns: {xs: "minmax(160px, 1fr)", md: "auto"},
                                            gap: 1,
                                            overflowX: {xs: "auto", md: "visible"},
                                            scrollSnapType: {xs: "x mandatory", md: "none"},
                                            pb: 0.5,
                                        }}
                                    >
                                        {storedBonuses.map((card) => {
                                            const isExpanded = expandedBonusId === card.id;
                                            return (
                                                <Box key={card.id} sx={{scrollSnapAlign: "start"}}>
                                                    <ButtonBase
                                                        onClick={() =>
                                                            setExpandedBonusId(isExpanded ? null : card.id)
                                                        }
                                                        sx={{
                                                            width: "100%",
                                                            border: "2px solid #1B1B1B",
                                                            backgroundColor: "#E6E6E2",
                                                            p: 1,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            textAlign: "left",
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
                                                    </ButtonBase>
                                                    <Collapse in={isExpanded} timeout={150}>
                                                        <Box
                                                            sx={{
                                                                border: "2px solid #1B1B1B",
                                                                borderTop: 0,
                                                                p: 1,
                                                            }}
                                                        >
                                                            <Typography variant="caption">
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

                <TabPanel active={tabIndex} index={1}>
                    <Box sx={{flex: 1, minHeight: 0, overflow: "auto"}}>
                        <Stack spacing={2}>
                            <Plate sx={{flexDirection: "column", alignItems: "flex-start", gap: 1}}>
                                <Typography variant="caption" fontWeight={700}>
                                    OPEN WINDOWS
                                </Typography>
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
                            </Plate>

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
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={onClearQueuedTactic}
                                            sx={{
                                                borderColor: "#E6E6E2",
                                                color: "#E6E6E2",
                                                "&:hover": {
                                                    backgroundColor: "#E6E6E2",
                                                    color: "#1F4E79",
                                                    borderColor: "#E6E6E2",
                                                },
                                            }}
                                        >
                                            CLEAR
                                        </Button>
                                    </Box>
                                </Plate>
                            ) : null}

                            {isTacticTargeting && tacticTargetingCard ? (
                                <Frame titleLeft="TACTIC TARGETING" accentColor="#F2B705">
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
                                                                    variant="caption">SUMMARY: {card.summary}</Typography>
                                                                {card.targeting.type === "unit" ? (
                                                                    isTargetingThis ? (
                                                                        <Stack direction="row" spacing={1}
                                                                               flexWrap="wrap">
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

                <TabPanel active={tabIndex} index={2}>
                    <Frame
                        titleLeft="LOG"
                        accentColor="#1B1B1B"
                        contentSx={{gap: 1}}
                        sx={{flex: 1, minHeight: 0}}
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
            </Box>
        </Box>
    );
}
