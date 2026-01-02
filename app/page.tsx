"use client";

import type { RefObject } from "react";
import { startTransition, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactionWindow } from "@/lib/engine";
import { gameReducer, initialGameState } from "@/lib/engine";
import { getMoveRange } from "@/lib/engine/movement";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import CommandHeader from "@/components/CommandHeader";
import MobileConsoleDrawer from "@/components/MobileConsoleDrawer";
import OpsConsole from "@/components/OpsConsole";
import Frame from "@/components/ui/Frame";
import ObliqueKey from "@/components/ui/ObliqueKey";
import ObliqueTabBar from "@/components/ui/ObliqueTabBar";
import PhaseRuler from "@/components/ui/PhaseRuler";
import Plate from "@/components/ui/Plate";
import OverlayPanel from "@/components/ui/OverlayPanel";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";
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
  const isTiny = useMediaQuery("(max-width:420px)");
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"cards" | "tactics" | "log">("cards");
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [commandBarHeight, setCommandBarHeight] = useState(0);
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

  useEffect(() => {
    if (!headerRef.current) {
      return;
    }
    const element = headerRef.current;
    const update = () => setCommandBarHeight(Math.ceil(element.getBoundingClientRect().height));
    update();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(element);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

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
  const reducedMotion = useReducedMotion();
  const SHOW_DEV_LOGS = process.env.NEXT_PUBLIC_SHOW_DEV_LOGS === "true";

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
    if (!SHOW_DEV_LOGS && consoleTab === "log") {
      setConsoleTab("cards");
    }
  }, [SHOW_DEV_LOGS, consoleTab]);

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
    fillHeight: boolean,
    options?: Pick<
      Parameters<typeof OpsConsole>[0],
      "activeTab" | "onTabChange" | "showHeader" | "showTabs" | "scrollMode"
    >
  ) => (
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
      {...options}
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
        bgcolor: "var(--surface)",
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      <Box
        component="header"
        ref={headerRef}
        sx={{
          px: 0,
          py: 0,
          display: "grid",
          gap: 0,
          position: isNarrow ? "sticky" : "relative",
          top: 0,
          zIndex: 20,
          backgroundColor: "var(--surface)",
        }}
      >
        <CommandHeader
          isNarrow={isNarrow}
          isTiny={isTiny}
          player={state.activePlayer}
          turn={state.turn}
          phase={state.phase}
          vp="--"
          mode={mode}
          status="READY"
          selectionLabel={selectionLabel}
          pendingAttackLabel={pendingAttackLabel}
          lastRollLabel={lastRollLabel}
          canDrawCard={canDrawCard}
          canMove={canMove}
          canAttack={canAttack}
          canRollDice={canRollDice}
          canResolveAttack={canResolveAttack}
          isGameOver={isGameOver}
          hasSelection={Boolean(selectedUnitId || selectedAttackerId || state.pendingAttack)}
          showConsoleToggle={isNarrow}
          onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
          onDrawCard={() => dispatch({ type: "DRAW_CARD" })}
          onMove={() => {
            setMode("MOVE");
            setSelectedAttackerId(null);
          }}
          onAttack={() => {
            setMode("ATTACK");
            setSelectedUnitId(null);
          }}
          onNextPhase={() => dispatch({ type: "NEXT_PHASE" })}
          onEndTurn={() => dispatch({ type: "END_TURN" })}
          onRollDice={() => {
            const reaction =
              queuedTactic?.window === "beforeAttackRoll" ? queuedTactic : undefined;
            dispatch({ type: "ROLL_DICE", ...(reaction ? { reaction } : {}) });
            if (reaction) {
              setQueuedTactic(null);
            }
          }}
          onResolveAttack={() => {
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
          onClearSelection={() => {
            setSelectedUnitId(null);
            setSelectedAttackerId(null);
          }}
        />
        <PhaseRuler phase={state.phase} compact={isNarrow} hideTopBorder />
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
          contentSx={{
            flex: 1,
            minHeight: 0,
            backgroundColor: "var(--board-surface)",
          }}
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
        <MobileConsoleDrawer
          open={isConsoleOpen}
          onOpenChange={setIsConsoleOpen}
          topOffset={commandBarHeight}
          header={
            <Plate accentColor="#1F4E79" sx={{ width: "100%", px: 2, py: 1 }}>
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
                  PLAYER: {state.activePlayer} • TURN: {state.turn}
                </Typography>
              </Box>
            </Plate>
          }
          tabs={
            <>
              <ObliqueTabBar
                tabs={[
                  { id: "cards", label: "CARDS" },
                  { id: "tactics", label: "TACTICS" },
                  { id: "log", label: "LOG", hidden: !SHOW_DEV_LOGS },
                ]}
                activeId={consoleTab}
                onChange={(id) => setConsoleTab(id as "cards" | "tactics" | "log")}
                size="md"
              />
              <Box sx={{ borderBottom: "2px solid #1B1B1B", mt: 0.5 }} />
            </>
          }
          body={opsConsole(false, {
            activeTab: consoleTab,
            onTabChange: setConsoleTab,
            showHeader: false,
            showTabs: false,
            scrollMode: "body",
          })}
        />
      ) : null}

      {isTargeting ? (
        <Box
          sx={{
            position: "fixed",
            left: 24,
            right: 24,
            bottom: 16,
            zIndex: 9999,
            transformOrigin: "bottom",
            transition: reducedMotion
              ? "none"
              : `opacity ${DUR.standard}ms ${EASE.stiff}, transform ${DUR.standard}ms ${EASE.stiff}`,
            opacity: 1,
            transform: reducedMotion ? "none" : "scaleY(1)",
          }}
        >
          <OverlayPanel
            title={`TARGETING ${isPendingTargeting ? "PENDING CARD" : "TACTIC"}`}
            tone={isPendingTargeting ? "focus" : "warning"}
            accent="yellow"
            rightActions={null}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                borderTop: "2px solid #1B1B1B",
              }}
            />
            <Box sx={{ borderTop: "2px solid #1B1B1B", pt: 1 }}>
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
                    <ObliqueKey
                      label="CONFIRM"
                      onClick={handleConfirmPendingTargets}
                      disabled={
                        pendingTargetingSpec?.type !== "unit" ||
                        selectedTargetUnitIds.length !== pendingTargetingSpec.count
                      }
                      tone="yellow"
                      size="sm"
                    />
                  ) : (
                    <ObliqueKey
                      label="CONFIRM"
                      onClick={handleConfirmTacticTargets}
                      disabled={
                        targetingSpec?.type !== "unit" ||
                        selectedTargetUnitIds.length !== targetingSpec.count
                      }
                      tone="yellow"
                      size="sm"
                    />
                  )}
                  <ObliqueKey
                    label="CANCEL"
                    onClick={handleCancelTargeting}
                    tone="neutral"
                    size="sm"
                  />
                </Stack>
              </Stack>
            </Box>
          </OverlayPanel>
        </Box>
      ) : null}
    </Box>
  );
}
