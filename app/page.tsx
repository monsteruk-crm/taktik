"use client";

import type { RefObject } from "react";
import { startTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactionWindow } from "@/lib/engine";
import { gameReducer, initialGameState } from "@/lib/engine";
import { getMoveRange } from "@/lib/engine/movement";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import OpsConsole from "@/components/OpsConsole";
import Frame from "@/components/ui/Frame";
import Plate from "@/components/ui/Plate";
import { getBoardOrigin, gridToScreen, screenToGrid } from "@/lib/ui/iso";

export default function Home() {
  type TargetingContext =
    | { source: "pending" }
    | { source: "tactic"; cardId: string; window: ReactionWindow };
  type QueuedTactic = {
    cardId: string;
    window: ReactionWindow;
    targets?: { unitIds?: string[] };
  };

  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [mode, setMode] = useState<"MOVE" | "ATTACK">("MOVE");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [targetingContext, setTargetingContext] = useState<TargetingContext | null>(null);
  const [selectedTargetUnitIds, setSelectedTargetUnitIds] = useState<string[]>([]);
  const [queuedTactic, setQueuedTactic] = useState<QueuedTactic | null>(null);
  const isNarrow = useMediaQuery("(max-width:1100px)");
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [sheetSize, setSheetSize] = useState<"peek" | "half" | "full">("peek");
  const isGameOver = state.phase === "VICTORY";
  const canMove = state.phase === "MOVEMENT" && !isGameOver;
  const canAttack = state.phase === "ATTACK" && !isGameOver;
  const canRollDice =
    state.phase === "DICE_RESOLUTION" &&
    !!state.pendingAttack &&
    !state.lastRoll &&
    !isGameOver;
  const canResolveAttack =
    state.phase === "DICE_RESOLUTION" &&
    !!state.pendingAttack &&
    !!state.lastRoll &&
    !isGameOver;
  const canDrawCard = !isGameOver && !state.pendingCard;
  const canStoreBonus =
    !isGameOver &&
    state.pendingCard?.kind === "bonus" &&
    state.storedBonuses.length < 6;
  const canPlayCard = !isGameOver && !!state.pendingCard;
  const moveRange = useMemo(() => {
    if (mode !== "MOVE" || !selectedUnitId) {
      return [];
    }
    return getMoveRange(state, selectedUnitId);
  }, [mode, selectedUnitId, state]);
  const pendingTargetingSpec = state.pendingCard?.targeting ?? null;
  const tacticById = useMemo(() => {
    return new Map(state.selectedTacticalDeck.map((card) => [card.id, card]));
  }, [state.selectedTacticalDeck]);
  const targetingCard =
    targetingContext?.source === "pending"
      ? state.pendingCard
      : targetingContext?.source === "tactic"
        ? tacticById.get(targetingContext.cardId) ?? null
        : null;
  const targetingSpec = targetingCard?.targeting ?? null;
  const isTargeting = !!targetingContext;
  const openReactionWindows = useMemo(() => {
    if (isGameOver) {
      return [] as ReactionWindow[];
    }
    const windows: ReactionWindow[] = [];
    if (state.phase === "MOVEMENT") {
      windows.push("beforeMove");
    }
    if (state.phase === "DICE_RESOLUTION" && state.pendingAttack) {
      if (!state.lastRoll) {
        windows.push("beforeAttackRoll");
      } else {
        windows.push("afterAttackRoll", "beforeDamage");
      }
    }
    return windows;
  }, [isGameOver, state.lastRoll, state.pendingAttack, state.phase]);
  const queuedTacticCard = queuedTactic ? tacticById.get(queuedTactic.cardId) ?? null : null;
  const tacticTargetingCard =
    targetingContext?.source === "tactic"
      ? tacticById.get(targetingContext.cardId) ?? null
      : null;

  const unitByPosition = useMemo(() => {
    const map = new Map<string, string>();
    for (const unit of state.units) {
      map.set(`${unit.position.x},${unit.position.y}`, unit.id);
    }
    return map;
  }, [state.units]);
  const { originX, originY } = useMemo(
    () => getBoardOrigin(state.boardWidth, state.boardHeight),
    [state.boardWidth, state.boardHeight]
  );
  const medianUnitPosition = useMemo(() => {
    if (state.units.length === 0) {
      return { x: Math.floor(state.boardWidth / 2), y: Math.floor(state.boardHeight / 2) };
    }
    const xs = state.units.map((unit) => unit.position.x).sort((a, b) => a - b);
    const ys = state.units.map((unit) => unit.position.y).sort((a, b) => a - b);
    const mid = Math.floor(xs.length / 2);
    const medianX =
      xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
    const medianY =
      ys.length % 2 === 0 ? (ys[mid - 1] + ys[mid]) / 2 : ys[mid];
    return { x: medianX, y: medianY };
  }, [state.boardHeight, state.boardWidth, state.units]);
  const initialPan = useMemo(() => {
    const { sx, sy } = gridToScreen(medianUnitPosition);
    const worldX = originX + sx;
    const worldY = originY + sy;
    return ({ width, height }: { width: number; height: number }) => ({
      x: width / 2 - worldX,
      y: height / 2 - worldY,
    });
  }, [medianUnitPosition, originX, originY]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const logRowHeight = 18;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  useEffect(() => {
    if (isConsoleOpen && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [isConsoleOpen]);

  useEffect(() => {
    startTransition(() => {
      if (targetingContext?.source === "pending") {
        setTargetingContext(null);
      }
      setSelectedTargetUnitIds([]);
    });
  }, [state.pendingCard?.id]);

  useEffect(() => {
    if (!isNarrow) {
      setIsConsoleOpen(false);
    }
  }, [isNarrow]);

  useEffect(() => {
    if (!queuedTactic) {
      return;
    }
    const windowOpen = openReactionWindows.includes(queuedTactic.window);
    const cardAvailable = tacticById.has(queuedTactic.cardId);
    if (!windowOpen || !cardAvailable) {
      setQueuedTactic(null);
    }
  }, [openReactionWindows, queuedTactic, tacticById]);

  useEffect(() => {
    if (!targetingContext || targetingContext.source !== "tactic") {
      return;
    }
    const windowOpen = openReactionWindows.includes(targetingContext.window);
    const cardAvailable = tacticById.has(targetingContext.cardId);
    if (!windowOpen || !cardAvailable) {
      setTargetingContext(null);
      setSelectedTargetUnitIds([]);
    }
  }, [openReactionWindows, targetingContext, tacticById]);

  useEffect(() => {
    setQueuedTactic(null);
    setTargetingContext(null);
    setSelectedTargetUnitIds([]);
  }, [state.activePlayer]);

  function handleTileClick(position: { x: number; y: number }) {
    const unitId = unitByPosition.get(`${position.x},${position.y}`);
    if (isTargeting && targetingSpec?.type === "unit") {
      if (!unitId) {
        return;
      }
      const clickedUnit = state.units.find((unit) => unit.id === unitId);
      if (!clickedUnit) {
        return;
      }
      const requiredOwner =
        targetingSpec.owner === "self"
          ? state.activePlayer
          : state.activePlayer === "PLAYER_A"
            ? "PLAYER_B"
            : "PLAYER_A";
      if (clickedUnit.owner !== requiredOwner) {
        return;
      }
      setSelectedTargetUnitIds((current) => {
        if (current.includes(unitId)) {
          return current.filter((id) => id !== unitId);
        }
        if (current.length >= targetingSpec.count) {
          return current;
        }
        return [...current, unitId];
      });
      return;
    }
    if (mode === "MOVE") {
      if (!canMove) {
        return;
      }
      if (unitId) {
        const unit = state.units.find((item) => item.id === unitId);
        if (!unit || unit.owner !== state.activePlayer) {
          return;
        }
        setSelectedUnitId(unitId);
        return;
      }
      if (selectedUnitId) {
        const inRange = moveRange.some(
          (rangePos) => rangePos.x === position.x && rangePos.y === position.y
        );
        if (inRange) {
          const reaction =
            queuedTactic?.window === "beforeMove" ? queuedTactic : undefined;
          dispatch({
            type: "MOVE_UNIT",
            unitId: selectedUnitId,
            to: position,
            ...(reaction ? { reaction } : {}),
          });
          if (reaction) {
            setQueuedTactic(null);
          }
        }
        setSelectedUnitId(null);
      }
      return;
    }

    if (!canAttack) {
      return;
    }
    if (!selectedAttackerId) {
      if (unitId) {
        setSelectedAttackerId(unitId);
      }
      return;
    }

    if (unitId) {
      dispatch({ type: "ATTACK_SELECT", attackerId: selectedAttackerId, targetId: unitId });
      setSelectedAttackerId(null);
    }
  }

  function handleViewportClick(args: {
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
  }) {
    if (!args.viewportRef.current) {
      return;
    }
    const rect = args.viewportRef.current.getBoundingClientRect();
    const localX = (args.clientX - rect.left - args.panX) / args.zoom;
    const localY = (args.clientY - rect.top - args.panY) / args.zoom;
    const { x, y } = screenToGrid(localX - originX, localY - originY);
    if (x < 0 || x >= state.boardWidth || y < 0 || y >= state.boardHeight) {
      return;
    }
    handleTileClick({ x, y });
  }



  const selectionLabel =
    mode === "MOVE" ? selectedUnitId ?? "None" : selectedAttackerId ?? "None";
  const pendingAttackLabel = state.pendingAttack
    ? `${state.pendingAttack.attackerId} -> ${state.pendingAttack.targetId}`
    : "None";
  const lastRollLabel = state.lastRoll
    ? `${state.lastRoll.value} -> ${state.lastRoll.outcome}`
    : "None";
  const isPendingTargeting = targetingContext?.source === "pending";
  const isTacticTargeting = targetingContext?.source === "tactic";
  const playerAccent = state.activePlayer === "PLAYER_A" ? "#1F4E79" : "#C1121F";
  const sheetHeights: Record<"peek" | "half" | "full", string> = {
    peek: "min(20dvh, 720px)",
    half: "min(55dvh, 720px)",
    full: "min(85dvh, 720px)",
  };

  function handleCancelTargeting() {
    setTargetingContext(null);
    setSelectedTargetUnitIds([]);
  }

  function handleStartPendingTargeting() {
    if (!state.pendingCard || pendingTargetingSpec?.type !== "unit") {
      return;
    }
    setTargetingContext({ source: "pending" });
    setSelectedUnitId(null);
    setSelectedAttackerId(null);
    setSelectedTargetUnitIds([]);
  }

  function handleConfirmPendingTargets() {
    if (!state.pendingCard) {
      return;
    }
    const targets =
      state.pendingCard.targeting.type === "unit" ? { unitIds: selectedTargetUnitIds } : undefined;
    dispatch({ type: "PLAY_CARD", cardId: state.pendingCard.id, targets });
    handleCancelTargeting();
  }

  function handleStartTacticTargeting(cardId: string, window: ReactionWindow) {
    setTargetingContext({ source: "tactic", cardId, window });
    setSelectedUnitId(null);
    setSelectedAttackerId(null);
    setSelectedTargetUnitIds([]);
  }

  function handleConfirmTacticTargets() {
    if (!tacticTargetingCard || targetingContext?.source !== "tactic") {
      return;
    }
    const targets =
      tacticTargetingCard.targeting.type === "unit" ? { unitIds: selectedTargetUnitIds } : undefined;
    setQueuedTactic({
      cardId: tacticTargetingCard.id,
      window: targetingContext.window,
      ...(targets ? { targets } : {}),
    });
    handleCancelTargeting();
  }

  const CommandKey = ({
    label,
    onClick,
    disabled,
    baseBg = "#E6E6E2",
    baseColor = "#1B1B1B",
    accentColor,
    active,
  }: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    baseBg?: string;
    baseColor?: string;
    accentColor?: string;
    active?: boolean;
  }) => (
    <Button
      variant="outlined"
      size="small"
      onClick={onClick}
      disabled={disabled}
      sx={{
        border: "2px solid #1B1B1B",
        backgroundColor: active ? baseColor : baseBg,
        color: active ? baseBg : baseColor,
        minWidth: { xs: 92, md: 110 },
        height: { xs: 36, md: 40 },
        letterSpacing: "0.08em",
        position: "relative",
        ...(accentColor
          ? {
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 6,
                backgroundColor: accentColor,
              },
              pl: 2,
            }
          : null),
        "&:hover": {
          backgroundColor: baseColor,
          color: baseBg,
          borderColor: "#1B1B1B",
        },
        "&.Mui-disabled": {
          opacity: 0.35,
          backgroundColor: baseBg,
          color: baseColor,
          borderColor: "#1B1B1B",
        },
        "&.Mui-disabled:hover": {
          backgroundColor: baseBg,
          color: baseColor,
        },
      }}
    >
      {label}
    </Button>
  );

  const opsConsole = (fillHeight: boolean) => (
    <OpsConsole
      commonDeckCount={state.commonDeck.length}
      pendingCard={state.pendingCard}
      storedBonuses={state.storedBonuses}
      tactics={state.selectedTacticalDeck}
      openReactionWindows={openReactionWindows}
      queuedTactic={queuedTactic}
      queuedTacticCard={queuedTacticCard}
      tacticTargetingCard={tacticTargetingCard}
      canStoreBonus={canStoreBonus}
      canPlayCard={canPlayCard}
      canDrawCard={canDrawCard}
      activePlayer={state.activePlayer}
      turn={state.turn}
      isPendingTargeting={isPendingTargeting}
      isTacticTargeting={isTacticTargeting}
      pendingTargetingSpec={pendingTargetingSpec}
      tacticTargetingSpec={tacticTargetingCard?.targeting ?? null}
      selectedTargetUnitIds={selectedTargetUnitIds}
      logEntries={state.log}
      logRef={logRef}
      logRowHeight={logRowHeight}
      fillHeight={fillHeight}
      onStoreBonus={() => dispatch({ type: "STORE_BONUS" })}
      onDrawCard={() => dispatch({ type: "DRAW_CARD" })}
      onStartPendingTargeting={handleStartPendingTargeting}
      onConfirmPendingTargets={handleConfirmPendingTargets}
      onPlayPendingCard={() => {
        if (!state.pendingCard) {
          return;
        }
        dispatch({ type: "PLAY_CARD", cardId: state.pendingCard.id });
        handleCancelTargeting();
      }}
      onStartTacticTargeting={handleStartTacticTargeting}
      onQueueTactic={(cardId, window) => {
        setQueuedTactic({ cardId, window });
      }}
      onConfirmTacticTargets={handleConfirmTacticTargets}
      onCancelTargeting={handleCancelTargeting}
      onClearQueuedTactic={() => setQueuedTactic(null)}
    />
  );

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      <Box
        component="header"
        sx={{
          borderBottom: "2px solid #1B1B1B",
          px: 2,
          py: 1,
          display: "grid",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateAreas: isNarrow
              ? '"player stats" "commands commands"'
              : '"player stats status" "commands commands commands"',
            gridTemplateColumns: isNarrow ? "1fr auto" : "auto 1fr auto",
            alignItems: "center",
          }}
        >
          <Plate accentColor={playerAccent} sx={{ gridArea: "player", minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700}>
              PLAYER: {state.activePlayer}
            </Typography>
          </Plate>
          <Box
            sx={{
              gridArea: "stats",
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: { xs: "flex-end", lg: "center" },
            }}
          >
            <Plate sx={{ py: 0.4, px: 1 }}>
              <Typography variant="caption">VP: --</Typography>
            </Plate>
            <Plate sx={{ py: 0.4, px: 1 }}>
              <Typography variant="caption">TURN: {state.turn}</Typography>
            </Plate>
            <Plate sx={{ py: 0.4, px: 1 }}>
              <Typography variant="caption">PHASE: {state.phase}</Typography>
            </Plate>
            {isNarrow ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsConsoleOpen((prev) => !prev)}
                sx={{
                  border: "2px solid #1B1B1B",
                  minHeight: 32,
                }}
              >
                CONSOLE
              </Button>
            ) : null}
          </Box>
          <Plate
            accentColor="#8A8F94"
            sx={{
              gridArea: "status",
              minWidth: 200,
              justifyContent: "space-between",
              display: isNarrow ? "none" : "flex",
            }}
          >
            <Typography variant="caption">STATUS: READY</Typography>
            <Typography variant="caption">MODE: {mode}</Typography>
          </Plate>

          <Box
            sx={{
              gridArea: "commands",
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
            }}
          >
            <CommandKey
              label="DRAW CARD"
              onClick={() => dispatch({ type: "DRAW_CARD" })}
              disabled={!canDrawCard}
            />
            <CommandKey
              label="MOVE"
              onClick={() => {
                setMode("MOVE");
                setSelectedAttackerId(null);
              }}
              disabled={!canMove}
              baseBg="#1F4E79"
              baseColor="#E6E6E2"
              active={mode === "MOVE"}
            />
            <CommandKey
              label="ATTACK"
              onClick={() => {
                setMode("ATTACK");
                setSelectedUnitId(null);
              }}
              disabled={!canAttack}
              baseBg="#C1121F"
              baseColor="#E6E6E2"
              active={mode === "ATTACK"}
            />
            <CommandKey
              label="NEXT PHASE"
              onClick={() => dispatch({ type: "NEXT_PHASE" })}
              disabled={isGameOver}
            />
            <CommandKey
              label="TURN START"
              onClick={() => dispatch({ type: "TURN_START" })}
              disabled={isGameOver}
            />
            <CommandKey
              label="END TURN"
              onClick={() => dispatch({ type: "END_TURN" })}
              disabled={isGameOver}
              accentColor="#C1121F"
            />
            <CommandKey
              label="ROLL DICE"
              onClick={() => {
                const reaction =
                  queuedTactic?.window === "beforeAttackRoll" ? queuedTactic : undefined;
                dispatch({ type: "ROLL_DICE", ...(reaction ? { reaction } : {}) });
                if (reaction) {
                  setQueuedTactic(null);
                }
              }}
              disabled={!canRollDice}
              accentColor="#F2B705"
            />
            <CommandKey
              label="RESOLVE ATTACK"
              onClick={() => {
                const reaction =
                  queuedTactic &&
                  (queuedTactic.window === "afterAttackRoll" ||
                    queuedTactic.window === "beforeDamage")
                    ? queuedTactic
                    : undefined;
                dispatch({ type: "RESOLVE_ATTACK", ...(reaction ? { reaction } : {}) });
                if (reaction) {
                  setQueuedTactic(null);
                }
              }}
              disabled={!canResolveAttack}
            />
            <CommandKey
              label="CLEAR SELECTION"
              onClick={() => {
                setSelectedUnitId(null);
                setSelectedAttackerId(null);
              }}
              disabled={!selectedUnitId && !selectedAttackerId}
            />
            <Plate sx={{ py: 0.35, px: 1 }}>
              <Typography variant="caption">MODE: {mode}</Typography>
            </Plate>
            <Plate sx={{ py: 0.35, px: 1 }}>
              <Typography variant="caption">SELECTED: {selectionLabel}</Typography>
            </Plate>
            <Plate sx={{ py: 0.35, px: 1 }}>
              <Typography variant="caption">PENDING: {pendingAttackLabel}</Typography>
            </Plate>
            <Plate sx={{ py: 0.35, px: 1 }}>
              <Typography variant="caption">LAST ROLL: {lastRollLabel}</Typography>
            </Plate>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Frame
          sx={{ flex: 1, minWidth: 0, minHeight: 0 }}
          contentSx={{ flex: 1, minHeight: 0 }}
          titleLeft="PLAY SURFACE"
          accentColor="#1B1B1B"
        >
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative" }}>
            <BoardViewport
              onClick={handleViewportClick}
              sx={{ height: "100%" }}
              initialPan={initialPan}
            >
              {() => (
                <IsometricBoard
                  state={state}
                  selectedUnitId={mode === "MOVE" ? selectedUnitId : selectedAttackerId}
                  moveRange={moveRange}
                />
              )}
            </BoardViewport>
          </Box>
        </Frame>
        <Box
          sx={{
            width: 420,
            display: isNarrow ? "none" : "flex",
            borderLeft: "2px solid #1B1B1B",
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
          }}
        >
          {opsConsole(true)}
        </Box>
      </Box>

      {isNarrow ? (
        <SwipeableDrawer
          anchor="bottom"
          open={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
          onOpen={() => setIsConsoleOpen(true)}
          PaperProps={{
            elevation: 0,
            sx: {
              height: sheetHeights[sheetSize],
              borderTop: "2px solid #1B1B1B",
              pt: 1,
              pb: "env(safe-area-inset-bottom)",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box
              onClick={() =>
                setSheetSize((current) =>
                  current === "peek" ? "half" : current === "half" ? "full" : "peek"
                )
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSheetSize((current) =>
                    current === "peek" ? "half" : current === "half" ? "full" : "peek"
                  );
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 24,
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 4,
                  bgcolor: "#1B1B1B",
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>{opsConsole(true)}</Box>
          </Box>
        </SwipeableDrawer>
      ) : null}

      {isTargeting ? (
        <Box
          sx={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 9999,
          }}
        >
          <Frame
            titleLeft={`TARGETING ${isPendingTargeting ? "PENDING CARD" : "TACTIC"}`}
            accentColor="#F2B705"
            contentSx={{ gap: 1 }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack spacing={0.25}>
                {targetingCard ? (
                  <Typography variant="caption">{targetingCard.name}</Typography>
                ) : null}
                {targetingSpec?.type === "unit" ? (
                  <Typography variant="caption">
                    SELECTED {selectedTargetUnitIds.length}/{targetingSpec.count}
                  </Typography>
                ) : null}
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {isPendingTargeting ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleConfirmPendingTargets}
                    disabled={
                      pendingTargetingSpec?.type !== "unit" ||
                      selectedTargetUnitIds.length !== pendingTargetingSpec.count
                    }
                  >
                    CONFIRM
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleConfirmTacticTargets}
                    disabled={
                      targetingSpec?.type !== "unit" ||
                      selectedTargetUnitIds.length !== targetingSpec.count
                    }
                  >
                    CONFIRM
                  </Button>
                )}
                <Button variant="outlined" size="small" onClick={handleCancelTargeting}>
                  CANCEL
                </Button>
              </Stack>
            </Stack>
          </Frame>
        </Box>
      ) : null}
    </Box>
  );
}
