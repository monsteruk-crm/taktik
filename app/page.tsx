"use client";

import type { RefObject } from "react";
import { startTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
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
  // Overlay-first command UI.
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [opsOpen, setOpsOpen] = useState(true);

  useEffect(() => {
    // Desktop defaults to open; mobile defaults to closed.
    setOpsOpen(isDesktop);
  }, [isDesktop]);
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
  const logRows = 5;
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
  const lastRollLabel = state.lastRoll ? `${state.lastRoll.value} -> ${state.lastRoll.outcome}` : "None";

  const opsContent = (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <CardPanel
        commonDeckCount={state.commonDeck.length}
        pendingCard={state.pendingCard}
        storedBonuses={state.storedBonuses}
        tactics={state.selectedTacticalDeck}
        openReactionWindows={openReactionWindows}
        queuedTactic={queuedTactic}
        queuedTacticCard={queuedTacticCard}
        tacticTargetingCard={tacticTargetingCard}
        canDrawCard={canDrawCard}
        canStoreBonus={canStoreBonus}
        canPlayCard={canPlayCard}
        isPendingTargeting={targetingContext?.source === "pending"}
        isTacticTargeting={targetingContext?.source === "tactic"}
        pendingTargetingSpec={pendingTargetingSpec}
        tacticTargetingSpec={tacticTargetingCard?.targeting ?? null}
        selectedTargetUnitIds={selectedTargetUnitIds}
        onDrawCard={() => dispatch({ type: "DRAW_CARD" })}
        onStoreBonus={() => dispatch({ type: "STORE_BONUS" })}
        onStartPendingTargeting={() => {
          if (!state.pendingCard || pendingTargetingSpec?.type !== "unit") {
            return;
          }
          setTargetingContext({ source: "pending" });
          setSelectedUnitId(null);
          setSelectedAttackerId(null);
          setSelectedTargetUnitIds([]);
        }}
        onConfirmPendingTargets={() => {
          if (!state.pendingCard) {
            return;
          }
          const targets =
            state.pendingCard.targeting.type === "unit" ? { unitIds: selectedTargetUnitIds } : undefined;
          dispatch({ type: "PLAY_CARD", cardId: state.pendingCard.id, targets });
          setTargetingContext(null);
          setSelectedTargetUnitIds([]);
        }}
        onPlayPendingCard={() => {
          if (!state.pendingCard) {
            return;
          }
          dispatch({ type: "PLAY_CARD", cardId: state.pendingCard.id });
          setTargetingContext(null);
          setSelectedTargetUnitIds([]);
        }}
        onStartTacticTargeting={(cardId, window) => {
          setTargetingContext({ source: "tactic", cardId, window });
          setSelectedUnitId(null);
          setSelectedAttackerId(null);
          setSelectedTargetUnitIds([]);
        }}
        onQueueTactic={(cardId, window) => {
          setQueuedTactic({ cardId, window });
        }}
        onConfirmTacticTargets={() => {
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
          setTargetingContext(null);
          setSelectedTargetUnitIds([]);
        }}
        onCancelTargeting={() => {
          setTargetingContext(null);
          setSelectedTargetUnitIds([]);
        }}
        onClearQueuedTactic={() => setQueuedTactic(null)}
      />

      <Paper sx={{ width: "100%", border: "1px solid #000", p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight={600}>
            Log
          </Typography>
          {!isDesktop ? (
            <Button variant="outlined" size="small" onClick={() => setOpsOpen(false)}>
              Close
            </Button>
          ) : null}
        </Stack>
        <Box
          ref={logRef}
          sx={{
            mt: 1,
            maxHeight: `${logRows * logRowHeight}px`,
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
      </Paper>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff", color: "#000000" }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid #000",
          bgcolor: "#fff",
        }}
      >
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Stack spacing={1}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack spacing={0.25}>
                <Typography variant="h4" fontWeight={600}>
                  TAKTIK MVP
                </Typography>
                <Typography variant="body2">Placeholder UI</Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Typography variant="body2">Current Player: {state.activePlayer}</Typography>
                <Typography variant="body2">Phase: {state.phase}</Typography>
                {state.winner ? <Typography variant="body2">Winner: {state.winner}</Typography> : null}
                <Button variant="outlined" size="small" onClick={() => setOpsOpen((v) => !v)}>
                  {opsOpen ? "Hide Panels" : "Show Panels"}
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: "#000" }} />

            <Stack direction="row" spacing={1} flexWrap="wrap">
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
                    queuedTactic && (queuedTactic.window === "afterAttackRoll" || queuedTactic.window === "beforeDamage")
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

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              <Typography variant="body2">Mode: {mode}</Typography>
              <Typography variant="body2">Selected: {selectionLabel}</Typography>
              <Typography variant="body2">Pending Attack: {pendingAttackLabel}</Typography>
              <Typography variant="body2">Last Roll: {lastRollLabel}</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth="xl"
        sx={{
          pt: 2,
          pb: 4,
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: { xs: "70vh", md: "78vh" },
          }}
        >
          <BoardViewport onClick={handleViewportClick} height="100%">
            {() => (
              <IsometricBoard
                state={state}
                selectedUnitId={mode === "MOVE" ? selectedUnitId : selectedAttackerId}
                moveRange={moveRange}
              />
            )}
          </BoardViewport>

          {/* Desktop: right-side overlay slab that does NOT shrink the board. */}
          {isDesktop && opsOpen ? (
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                bottom: 16,
                width: 420,
                overflow: "auto",
                bgcolor: "#fff",
                border: "1px solid #000",
                p: 2,
              }}
            >
              {opsContent}
            </Box>
          ) : null}

          {/* Mobile: panels open as a bottom drawer. */}
          {!isDesktop ? (
            <Drawer
              anchor="bottom"
              open={opsOpen}
              onClose={() => setOpsOpen(false)}
              PaperProps={{
                sx: {
                  borderTop: "1px solid #000",
                  p: 2,
                },
              }}
            >
              {opsContent}
            </Drawer>
          ) : null}

          {/* Mobile: floating button to open panels. */}
          {!isDesktop && !opsOpen ? (
            <Box sx={{ position: "absolute", right: 16, bottom: 16 }}>
              <Button variant="outlined" onClick={() => setOpsOpen(true)}>
                Open Panels
              </Button>
            </Box>
          ) : null}
        </Box>
      </Container>
    </Box>
  );
}
