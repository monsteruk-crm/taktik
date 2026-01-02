"use client";

import type { RefObject } from "react";
import { startTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactionWindow } from "@/lib/engine";
import { gameReducer, initialGameState } from "@/lib/engine";
import { getMoveRange } from "@/lib/engine/movement";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import OpsConsole from "@/components/OpsConsole";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
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
    if (!isMobile) {
      setIsConsoleOpen(false);
    }
  }, [isMobile]);

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

  const opsConsole = (
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
      isPendingTargeting={isPendingTargeting}
      isTacticTargeting={isTacticTargeting}
      pendingTargetingSpec={pendingTargetingSpec}
      tacticTargetingSpec={tacticTargetingCard?.targeting ?? null}
      selectedTargetUnitIds={selectedTargetUnitIds}
      logEntries={state.log}
      logRef={logRef}
      logRowHeight={logRowHeight}
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
      <AppBar
        position="static"
        elevation={0}
        color="transparent"
        sx={{
          border: 0,
          borderBottom: "2px solid #1B1B1B",
          bgcolor: "background.default",
          color: "text.primary",
          height: { xs: 56, md: 64 },
          px: 2,
          py: 0.5,
        }}
      >
        <Box
          sx={{
            height: "100%",
            display: "grid",
            gridTemplateRows: "1fr 1fr",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              minWidth: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ minWidth: 0, overflow: "hidden" }}
            >
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                TAKTIK MVP
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: "nowrap", overflow: "hidden" }}
              >
                <Typography variant="caption" noWrap>
                  PLAYER: {state.activePlayer}
                </Typography>
                <Typography variant="caption" noWrap>
                  VP: --
                </Typography>
                <Typography variant="caption" noWrap>
                  TURN: {state.turn}
                </Typography>
                <Typography variant="caption" noWrap>
                  PHASE: {state.phase}
                </Typography>
                {state.winner ? (
                  <Typography variant="caption" noWrap>
                    WINNER: {state.winner}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsConsoleOpen((prev) => !prev)}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              CONSOLE
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 1,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Stack direction="row" spacing={1} sx={{ width: "max-content" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => dispatch({ type: "DRAW_CARD" })}
                  disabled={!canDrawCard}
                >
                  DRAW CARD
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setMode("MOVE");
                    setSelectedAttackerId(null);
                  }}
                  disabled={!canMove}
                >
                  MOVE
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setMode("ATTACK");
                    setSelectedUnitId(null);
                  }}
                  disabled={!canAttack}
                >
                  ATTACK
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => dispatch({ type: "NEXT_PHASE" })}
                  disabled={isGameOver}
                >
                  NEXT PHASE
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => dispatch({ type: "TURN_START" })}
                  disabled={isGameOver}
                >
                  TURN START
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => dispatch({ type: "END_TURN" })}
                  disabled={isGameOver}
                >
                  END TURN
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const reaction =
                      queuedTactic?.window === "beforeAttackRoll" ? queuedTactic : undefined;
                    dispatch({ type: "ROLL_DICE", ...(reaction ? { reaction } : {}) });
                    if (reaction) {
                      setQueuedTactic(null);
                    }
                  }}
                  disabled={!canRollDice}
                >
                  ROLL DICE
                </Button>
                <Button
                  variant="outlined"
                  size="small"
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
                >
                  RESOLVE ATTACK
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedUnitId(null);
                    setSelectedAttackerId(null);
                  }}
                  disabled={!selectedUnitId && !selectedAttackerId}
                >
                  CLEAR SELECTION
                </Button>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} sx={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              <Typography variant="caption" noWrap>
                MODE: {mode}
              </Typography>
              <Typography variant="caption" noWrap>
                SELECTED: {selectionLabel}
              </Typography>
              <Typography variant="caption" noWrap>
                PENDING: {pendingAttackLabel}
              </Typography>
              <Typography variant="caption" noWrap>
                LAST ROLL: {lastRollLabel}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, position: "relative" }}>
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
        <Box
          sx={{
            width: 420,
            display: { xs: "none", md: "flex" },
            borderLeft: "2px solid #1B1B1B",
            minHeight: 0,
          }}
        >
          {opsConsole}
        </Box>
      </Box>

      {isMobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
          onOpen={() => setIsConsoleOpen(true)}
          PaperProps={{
            elevation: 0,
            sx: {
              height: "min(80dvh, 640px)",
              borderTop: "2px solid #1B1B1B",
              pb: "env(safe-area-inset-bottom)",
              overflow: "hidden",
            },
          }}
        >
          {opsConsole}
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
          <Paper sx={{ border: "2px solid #1B1B1B", p: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack spacing={0.25}>
                <Typography variant="caption" fontWeight={700}>
                  Targeting {isPendingTargeting ? "Pending Card" : "Tactic"}
                </Typography>
                {targetingCard ? (
                  <Typography variant="caption">{targetingCard.name}</Typography>
                ) : null}
                {targetingSpec?.type === "unit" ? (
                  <Typography variant="caption">
                    Selected {selectedTargetUnitIds.length}/{targetingSpec.count}
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
                    Confirm
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
                    Confirm
                  </Button>
                )}
                <Button variant="outlined" size="small" onClick={handleCancelTargeting}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      ) : null}
    </Box>
  );
}
