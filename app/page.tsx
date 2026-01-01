"use client";

import type { RefObject } from "react";
import { startTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { gameReducer, initialGameState } from "@/lib/engine";
import { getMoveRange } from "@/lib/engine/movement";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import CardPanel from "@/lib/ui/CardPanel";
import { getBoardOrigin, screenToGrid } from "@/lib/ui/iso";

export default function Home() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [mode, setMode] = useState<"MOVE" | "ATTACK">("MOVE");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [isCardTargeting, setIsCardTargeting] = useState(false);
  const [selectedCardTargetUnitIds, setSelectedCardTargetUnitIds] = useState<string[]>([]);
  const isGameOver = state.phase === "VICTORY";
  const canMove = state.phase === "MOVEMENT" && !isGameOver;
  const canAttack = state.phase === "ATTACK" && !isGameOver;
  const canRollDice = state.phase === "DICE_RESOLUTION" && !isGameOver;
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
  const targetingSpec = state.pendingCard?.targeting ?? null;

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
      setIsCardTargeting(false);
      setSelectedCardTargetUnitIds([]);
    });
  }, [state.pendingCard?.id]);

  function handleTileClick(position: { x: number; y: number }) {
    const unitId = unitByPosition.get(`${position.x},${position.y}`);
    if (isCardTargeting && state.pendingCard && targetingSpec?.type === "unit") {
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
      setSelectedCardTargetUnitIds((current) => {
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
          dispatch({ type: "MOVE_UNIT", unitId: selectedUnitId, to: position });
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



  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ffffff", color: "#000000", py: 4 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={2} alignItems="center">
        <Typography variant="h4" fontWeight={600}>
          TAKTIK MVP
        </Typography>
        <Typography variant="body1">Placeholder UI</Typography>
        <Typography variant="body1">Current Player: {state.activePlayer}</Typography>
        <Typography variant="body1">Phase: {state.phase}</Typography>
        {state.winner ? <Typography variant="body1">Winner: {state.winner}</Typography> : null}
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
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
          <Button
            variant="outlined"
            onClick={() => dispatch({ type: "NEXT_PHASE" })}
            disabled={isGameOver}
          >
            Next Phase
          </Button>
          <Button
            variant="outlined"
            onClick={() => dispatch({ type: "TURN_START" })}
            disabled={isGameOver}
          >
            Turn Start
          </Button>
          <Button
            variant="outlined"
            onClick={() => dispatch({ type: "END_TURN" })}
            disabled={isGameOver}
          >
            End Turn
          </Button>
          <Button
            variant="outlined"
            onClick={() => dispatch({ type: "ROLL_DICE" })}
            disabled={!canRollDice}
          >
            Roll Dice
          </Button>
        </Stack>
        <Stack spacing={0.5} alignItems="center">
          <Typography variant="body2">Mode: {mode}</Typography>
          <Typography variant="body2">
            Selected: {mode === "MOVE" ? selectedUnitId ?? "None" : selectedAttackerId ?? "None"}
          </Typography>
          <Typography variant="body2">
            Pending Attack:{" "}
            {state.pendingAttack
              ? `${state.pendingAttack.attackerId} -> ${state.pendingAttack.targetId}`
              : "None"}
          </Typography>
          <Typography variant="body2">
            Last Roll:{" "}
            {state.lastRoll ? `${state.lastRoll.value} -> ${state.lastRoll.outcome}` : "None"}
          </Typography>
        </Stack>
          <Box sx={{ flexGrow: 1, width: "100%" }}>
            <Grid container spacing={2}>
            <Grid size={8}>
              <BoardViewport onClick={handleViewportClick}>
                {() => (
                  <IsometricBoard
                    state={state}
                    selectedUnitId={mode === "MOVE" ? selectedUnitId : selectedAttackerId}
                    moveRange={moveRange}
                  />
                )}
              </BoardViewport>
            </Grid>
            <Grid size={4}>
              <Stack spacing={2} sx={{ width: "100%" }}>
                <CardPanel
                  commonDeckCount={state.commonDeck.length}
                  pendingCard={state.pendingCard}
                  storedBonuses={state.storedBonuses}
                  canDrawCard={canDrawCard}
                  canStoreBonus={canStoreBonus}
                  canPlayCard={canPlayCard}
                  isTargeting={isCardTargeting}
                  targetingSpec={targetingSpec}
                  selectedTargetUnitIds={selectedCardTargetUnitIds}
                  onDrawCard={() => dispatch({ type: "DRAW_CARD" })}
                  onStoreBonus={() => dispatch({ type: "STORE_BONUS" })}
                  onStartTargeting={() => {
                    if (!state.pendingCard || targetingSpec?.type !== "unit") {
                      return;
                    }
                    setIsCardTargeting(true);
                    setSelectedUnitId(null);
                    setSelectedAttackerId(null);
                    setSelectedCardTargetUnitIds([]);
                  }}
                  onConfirmPlayCard={() => {
                    if (!state.pendingCard) {
                      return;
                    }
                    const targets =
                      state.pendingCard.targeting.type === "unit"
                        ? { unitIds: selectedCardTargetUnitIds }
                        : undefined;
                    dispatch({ type: "PLAY_CARD", cardId: state.pendingCard.id, targets });
                    setIsCardTargeting(false);
                    setSelectedCardTargetUnitIds([]);
                  }}
                  onCancelTargeting={() => {
                    setIsCardTargeting(false);
                    setSelectedCardTargetUnitIds([]);
                  }}
                />
                <Paper sx={{ width: "100%", border: "1px solid #000", p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Log
                  </Typography>
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
            </Grid>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
