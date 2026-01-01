"use client";

import type { RefObject } from "react";
import { startTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
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
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactionWindow } from "@/lib/engine";
import { gameReducer, initialGameState } from "@/lib/engine";
import { getMoveRange } from "@/lib/engine/movement";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import CardPanel from "@/lib/ui/CardPanel";
import { getBoardOrigin, screenToGrid } from "@/lib/ui/iso";

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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isCardsOverlayOpen, setIsCardsOverlayOpen] = useState(false);
  const [isLogOverlayOpen, setIsLogOverlayOpen] = useState(false);
  const [contextSheetSize, setContextSheetSize] = useState<"peek" | "half" | "full">(
    "peek"
  );
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
  const logRef = useRef<HTMLDivElement | null>(null);
  const logRowHeight = 18;

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  useEffect(() => {
    startTransition(() => {
      if (targetingContext?.source === "pending") {
        setTargetingContext(null);
      }
      setSelectedTargetUnitIds([]);
    });
  }, [state.pendingCard?.id]);

  useEffect(() => {
    if (state.pendingCard && targetingContext?.source !== "pending") {
      setIsCardsOverlayOpen(true);
    }
  }, [state.pendingCard?.id, targetingContext]);

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
  const selectedUnit =
    (mode === "MOVE" ? selectedUnitId : selectedAttackerId) &&
    state.units.find(
      (unit) => unit.id === (mode === "MOVE" ? selectedUnitId : selectedAttackerId)
    );
  const contextOpen = Boolean(
    selectedUnit ||
      state.pendingAttack ||
      state.pendingCard ||
      queuedTactic
  );
  const isPendingTargeting = targetingContext?.source === "pending";
  const isTacticTargeting = targetingContext?.source === "tactic";
  const cardsOverlayOpen =
    (Boolean(state.pendingCard) && !isPendingTargeting) || (isCardsOverlayOpen && !isTargeting);

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
    setIsCardsOverlayOpen(false);
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
    setIsCardsOverlayOpen(false);
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

  const cardsContent = (
    <CardPanel
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
      isPendingTargeting={isPendingTargeting}
      isTacticTargeting={isTacticTargeting}
      pendingTargetingSpec={pendingTargetingSpec}
      tacticTargetingSpec={tacticTargetingCard?.targeting ?? null}
      selectedTargetUnitIds={selectedTargetUnitIds}
      onStoreBonus={() => dispatch({ type: "STORE_BONUS" })}
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
        minHeight: "100dvh",
        bgcolor: "#ffffff",
        color: "#000000",
        "--command-bar-height": { xs: "120px", md: "88px" },
        pt: "var(--command-bar-height)",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "var(--command-bar-height)",
          zIndex: 30,
          borderBottom: "1px solid #000",
          bgcolor: "#fff",
          px: 2,
          py: 1,
        }}
      >
        <Stack spacing={1}>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle1" fontWeight={700}>
              TAKTIK MVP
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Typography variant="body2">Player: {state.activePlayer}</Typography>
              <Typography variant="body2">VP: --</Typography>
              <Typography variant="body2">Turn: {state.turn}</Typography>
              <Typography variant="body2">Phase: {state.phase}</Typography>
              {state.winner ? <Typography variant="body2">Winner: {state.winner}</Typography> : null}
            </Stack>
          </Stack>

          <Divider sx={{ borderColor: "#000" }} />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={() => dispatch({ type: "DRAW_CARD" })}
              disabled={!canDrawCard}
            >
              Draw Card
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setMode("MOVE");
                setSelectedAttackerId(null);
              }}
              disabled={!canMove}
            >
              Move
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setMode("ATTACK");
                setSelectedUnitId(null);
              }}
              disabled={!canAttack}
            >
              Attack
            </Button>
            <Button variant="outlined" onClick={() => dispatch({ type: "NEXT_PHASE" })} disabled={isGameOver}>
              Next Phase
            </Button>
            <Button variant="outlined" onClick={() => dispatch({ type: "TURN_START" })} disabled={isGameOver}>
              Turn Start
            </Button>
            <Button variant="outlined" onClick={() => dispatch({ type: "END_TURN" })} disabled={isGameOver}>
              End Turn
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const reaction = queuedTactic?.window === "beforeAttackRoll" ? queuedTactic : undefined;
                dispatch({ type: "ROLL_DICE", ...(reaction ? { reaction } : {}) });
                if (reaction) {
                  setQueuedTactic(null);
                }
              }}
              disabled={!canRollDice}
            >
              Roll Dice
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const reaction =
                  queuedTactic &&
                  (queuedTactic.window === "afterAttackRoll" || queuedTactic.window === "beforeDamage")
                    ? queuedTactic
                    : undefined;
                dispatch({ type: "RESOLVE_ATTACK", ...(reaction ? { reaction } : {}) });
                if (reaction) {
                  setQueuedTactic(null);
                }
              }}
              disabled={!canResolveAttack}
            >
              Resolve Attack
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Typography variant="body2">Mode: {mode}</Typography>
            <Typography variant="body2">Selected: {selectionLabel}</Typography>
            <Typography variant="body2">Pending Attack: {pendingAttackLabel}</Typography>
            <Typography variant="body2">Last Roll: {lastRollLabel}</Typography>
          </Stack>
        </Stack>
      </Box>

      <BoardViewport onClick={handleViewportClick}>
        {() => (
          <IsometricBoard
            state={state}
            selectedUnitId={mode === "MOVE" ? selectedUnitId : selectedAttackerId}
            moveRange={moveRange}
          />
        )}
      </BoardViewport>

      {contextOpen ? (
        <Drawer
          anchor={isMobile ? "bottom" : "right"}
          open={contextOpen}
          onClose={() => {
            if (isMobile) {
              setContextSheetSize("peek");
            }
          }}
          ModalProps={{
            hideBackdrop: true,
            disableAutoFocus: true,
            disableEnforceFocus: true,
            disableRestoreFocus: true,
          }}
          slotProps={{
            root: {
              sx: {
                pointerEvents: "none",
              },
            },
            paper: {
              sx: {
                pointerEvents: "auto",
                width: isMobile ? "100%" : 360,
                height: isMobile
                    ? contextSheetSize === "full"
                        ? "80dvh"
                        : contextSheetSize === "half"
                            ? "45dvh"
                            : "20dvh"
                    : "auto",
                borderTop: isMobile ? "2px solid #000" : "none",
                borderLeft: !isMobile ? "2px solid #000" : "none",
                p: 2,
              },
            },
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                Context
              </Typography>
              {isMobile ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setContextSheetSize("peek")}
                  >
                    Peek
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setContextSheetSize("half")}
                  >
                    Half
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setContextSheetSize("full")}
                  >
                    Full
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            <Divider sx={{ borderColor: "#000" }} />

            <Stack spacing={1}>
              {selectedUnit ? (
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#000" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" fontWeight={600}>
                      Selected Unit
                    </Typography>
                    <Typography variant="caption">ID: {selectedUnit.id}</Typography>
                    <Typography variant="caption">Owner: {selectedUnit.owner}</Typography>
                    <Typography variant="caption">Type: {selectedUnit.type}</Typography>
                    <Typography variant="caption">
                      Position: ({selectedUnit.position.x}, {selectedUnit.position.y})
                    </Typography>
                  </Stack>
                </Paper>
              ) : (
                <Typography variant="caption">No unit selected.</Typography>
              )}

              {state.pendingAttack ? (
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#000" }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" fontWeight={600}>
                      Pending Attack
                    </Typography>
                    <Typography variant="caption">
                      {state.pendingAttack.attackerId} → {state.pendingAttack.targetId}
                    </Typography>
                  </Stack>
                </Paper>
              ) : null}

              {state.pendingCard ? (
                <Typography variant="caption">Pending card ready to resolve.</Typography>
              ) : null}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsCardsOverlayOpen(true)}
                disabled={
                  !state.pendingCard &&
                  state.storedBonuses.length === 0 &&
                  openReactionWindows.length === 0
                }
              >
                Cards & Tactics
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsLogOverlayOpen(true)}
                disabled={state.log.length === 0}
              >
                Log
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
                Clear Selection
              </Button>
            </Stack>
          </Stack>
        </Drawer>
      ) : null}

      {cardsOverlayOpen ? (
        isMobile ? (
          <Drawer
            anchor="bottom"
            open
            onClose={() => setIsCardsOverlayOpen(false)}
            transitionDuration={0}
            PaperProps={{
              sx: {
                borderTop: "2px solid #000",
                p: 2,
                height: "85dvh",
              },
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Cards & Tactics
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setIsCardsOverlayOpen(false)}>
                  Close
                </Button>
              </Stack>
              {cardsContent}
            </Stack>
          </Drawer>
        ) : (
          <Dialog
            open
            onClose={() => setIsCardsOverlayOpen(false)}
            fullWidth
            maxWidth="md"
            transitionDuration={0}
            PaperProps={{ sx: { border: "2px solid #000" } }}
          >
            <DialogTitle sx={{ borderBottom: "1px solid #000" }}>Cards & Tactics</DialogTitle>
            <DialogContent sx={{ py: 2 }}>{cardsContent}</DialogContent>
          </Dialog>
        )
      ) : null}

      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={isLogOverlayOpen}
          onClose={() => setIsLogOverlayOpen(false)}
          slotProps={{
            paper:{
            sx: {
              borderTop: "2px solid #000",
              p: 2,
              height: "60dvh",
            }}
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                Log
              </Typography>
              <Button variant="outlined" size="small" onClick={() => setIsLogOverlayOpen(false)}>
                Close
              </Button>
            </Stack>
            <Box
              ref={logRef}
              sx={{
                mt: 1,
                overflowY: "auto",
                pr: 1,
              }}
            >
              <Stack spacing={0.5}>
                {state.log.map((entry, index) => (
                  <Typography
                    key={`${entry}-${index}`}
                    variant="caption"
                    sx={{ minHeight: `${logRowHeight}px`, lineHeight: `${logRowHeight}px` }}
                  >
                    {entry || " "}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Drawer>
      ) : (
        <Dialog
          open={isLogOverlayOpen}
          onClose={() => setIsLogOverlayOpen(false)}
          fullWidth
          maxWidth="sm"
          slotProps={{paper:{ sx: { border: "2px solid #000" } }}}
        >
          <DialogTitle sx={{ borderBottom: "1px solid #000" }}>Log</DialogTitle>
          <DialogContent sx={{ py: 2 }}>
            <Box
              ref={logRef}
              sx={{
                maxHeight: "60dvh",
                overflowY: "auto",
                pr: 1,
              }}
            >
              <Stack spacing={0.5}>
                {state.log.map((entry, index) => (
                  <Typography
                    key={`${entry}-${index}`}
                    variant="caption"
                    sx={{ minHeight: `${logRowHeight}px`, lineHeight: `${logRowHeight}px` }}
                  >
                    {entry || " "}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </DialogContent>
        </Dialog>
      )}

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
          <Paper sx={{ border: "2px solid #000", p: 2 }}>
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
