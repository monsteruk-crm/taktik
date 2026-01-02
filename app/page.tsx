"use client";

import type { RefObject } from "react";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Player, ReactionWindow } from "@/lib/engine";
import { gameReducer, getOpenReactionWindows, initialGameState } from "@/lib/engine";
import { getMoveRange } from "@/lib/engine/movement";
import BoardViewport from "@/components/BoardViewport";
import IsometricBoard from "@/components/IsometricBoard";
import CommandHeader from "@/components/CommandHeader";
import EdgeCommandDock from "@/components/EdgeCommandDock";
import MobileConsoleDrawer from "@/components/MobileConsoleDrawer";
import OpsConsole from "@/components/OpsConsole";
import Frame from "@/components/ui/Frame";
import ObliqueKey from "@/components/ui/ObliqueKey";
import ObliqueTabBar from "@/components/ui/ObliqueTabBar";
import PhaseRuler from "@/components/ui/PhaseRuler";
import Plate from "@/components/ui/Plate";
import OverlayPanel from "@/components/ui/OverlayPanel";
import StatusCapsule from "@/components/ui/StatusCapsule";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";
import { getBoardOrigin, gridToScreen, screenToGrid } from "@/lib/ui/iso";
import { shortKey, shortUnit } from "@/lib/ui/headerFormat";
import { semanticColors } from "@/lib/ui/semanticColors";
import SkewedButton from "@/components/ui/SkewedButton";
import SkewedTabsConditional from "@/components/ui/SkewedTabsConditional";

export default function Home() {
  type TargetingContext =
    | { source: "pending"; ownerId: Player }
    | { source: "tactic"; cardId: string; window: ReactionWindow; ownerId: Player };
  type QueuedTactic = {
    cardId: string;
    window: ReactionWindow;
    targets?: { unitIds?: string[] };
    ownerId: Player;
  };

  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [mode, setMode] = useState<"MOVE" | "ATTACK">("MOVE");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [targetingContext, setTargetingContext] = useState<TargetingContext | null>(null);
  const targetingContextRef = useRef<TargetingContext | null>(null);
  const [selectedTargetUnitIds, setSelectedTargetUnitIds] = useState<string[]>([]);
  const [queuedTactic, setQueuedTactic] = useState<QueuedTactic | null>(null);
  const isNarrow = useMediaQuery("(max-width:1100px)");
  const isTiny = useMediaQuery("(max-width:420px)");
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const isShort = useMediaQuery("(max-height:520px)");
  const landscapeMode = isNarrow && isLandscape && isShort;
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<"cards" | "tactics" | "log">("cards");
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [commandBarHeight, setCommandBarHeight] = useState(0);
  const [dockOpen, setDockOpen] = useState(false);
  const [dockPinned, setDockPinned] = useState(false);
  const [dockTab, setDockTab] = useState<"cmd" | "console">("cmd");
  const dockAutoOpenRef = useRef<number | null>(null);
  const dockAutoCloseRef = useRef<number | null>(null);
  const dockEnteredRef = useRef(false);
  const lastPhaseRef = useRef<string | null>(null);
  const dockInteractedRef = useRef(false);
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
  const openReactionWindows = useMemo(() => getOpenReactionWindows(state), [state]);
  const SHOW_DEV_LOGS = process.env.NEXT_PUBLIC_SHOW_DEV_LOGS === "true";
  const resolvedConsoleTab =
    !SHOW_DEV_LOGS && consoleTab === "log" ? "cards" : consoleTab;
  const consoleOpen = isNarrow && !landscapeMode ? isConsoleOpen : false;
  const playerStripe =
    state.activePlayer === "PLAYER_A" ? semanticColors.playerA : semanticColors.playerB;
  const resolvedQueuedTactic = useMemo(() => {
    if (!queuedTactic) {
      return null;
    }
    if (queuedTactic.ownerId !== state.activePlayer) {
      return null;
    }
    if (!openReactionWindows.includes(queuedTactic.window)) {
      return null;
    }
    if (!tacticById.has(queuedTactic.cardId)) {
      return null;
    }
    return queuedTactic;
  }, [openReactionWindows, queuedTactic, state.activePlayer, tacticById]);
  const queuedTacticCard = resolvedQueuedTactic
    ? tacticById.get(resolvedQueuedTactic.cardId) ?? null
    : null;
  const resolvedTargetingContext = useMemo(() => {
    if (!targetingContext) {
      return null;
    }
    if (targetingContext.ownerId !== state.activePlayer) {
      return null;
    }
    if (targetingContext.source === "tactic") {
      if (!openReactionWindows.includes(targetingContext.window)) {
        return null;
      }
      if (!tacticById.has(targetingContext.cardId)) {
        return null;
      }
    }
    return targetingContext;
  }, [openReactionWindows, state.activePlayer, tacticById, targetingContext]);
  const targetingCard =
    resolvedTargetingContext?.source === "pending"
      ? state.pendingCard
      : resolvedTargetingContext?.source === "tactic"
        ? tacticById.get(resolvedTargetingContext.cardId) ?? null
        : null;
  const targetingSpec = targetingCard?.targeting ?? null;
  const isTargeting = !!resolvedTargetingContext;
  const resolvedTargetUnitIds = isTargeting ? selectedTargetUnitIds : [];
  const tacticTargetingCard =
    resolvedTargetingContext?.source === "tactic"
      ? tacticById.get(resolvedTargetingContext.cardId) ?? null
      : null;

  useEffect(() => {
    targetingContextRef.current = targetingContext;
  }, [targetingContext]);

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

  useEffect(() => {
    return () => {
      if (dockAutoOpenRef.current) {
        window.clearTimeout(dockAutoOpenRef.current);
      }
      if (dockAutoCloseRef.current) {
        window.clearTimeout(dockAutoCloseRef.current);
      }
    };
  }, []);

  const scheduleDockAutoClose = useCallback(() => {
    if (dockPinned) {
      return;
    }
    if (dockAutoCloseRef.current) {
      window.clearTimeout(dockAutoCloseRef.current);
    }
    dockAutoCloseRef.current = window.setTimeout(() => {
      if (!dockPinned && !dockInteractedRef.current) {
        setDockOpen(false);
      }
    }, 2200);
  }, [dockPinned]);

  const triggerDockAutoOpen = useCallback(
    (tab: "cmd" | "console") => {
      if (!landscapeMode || dockPinned) {
        return;
      }
      dockInteractedRef.current = false;
      if (dockAutoOpenRef.current) {
        window.clearTimeout(dockAutoOpenRef.current);
      }
      dockAutoOpenRef.current = window.setTimeout(() => {
        setDockTab(tab);
        setDockOpen(true);
        scheduleDockAutoClose();
      }, 0);
    },
    [dockPinned, landscapeMode, scheduleDockAutoClose]
  );

  const handleDockInteract = useCallback(() => {
    dockInteractedRef.current = true;
    if (dockAutoCloseRef.current) {
      window.clearTimeout(dockAutoCloseRef.current);
    }
  }, []);

  const openDockCmd = useCallback(() => {
    handleDockInteract();
    setDockTab("cmd");
    setDockOpen(true);
  }, [handleDockInteract]);

  const openDockConsole = useCallback(() => {
    handleDockInteract();
    setDockTab("console");
    setDockOpen(true);
  }, [handleDockInteract]);

  useEffect(() => {
    if (!landscapeMode) {
      dockEnteredRef.current = false;
      return;
    }
    if (!dockEnteredRef.current) {
      dockEnteredRef.current = true;
      triggerDockAutoOpen("cmd");
    }
  }, [landscapeMode, triggerDockAutoOpen]);

  useEffect(() => {
    if (!landscapeMode) {
      return;
    }
    if (lastPhaseRef.current !== state.phase) {
      lastPhaseRef.current = state.phase;
      if (state.phase === "CARD_DRAW" || state.phase === "DICE_RESOLUTION") {
        triggerDockAutoOpen("cmd");
      }
    }
  }, [landscapeMode, state.phase, triggerDockAutoOpen]);

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

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  useEffect(() => {
    if (consoleOpen && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [consoleOpen]);

  const prevPendingCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevPendingCardIdRef.current === state.pendingCard?.id) {
      return;
    }
    prevPendingCardIdRef.current = state.pendingCard?.id ?? null;
    startTransition(() => {
      if (targetingContextRef.current?.source === "pending") {
        setTargetingContext(null);
      }
      setSelectedTargetUnitIds([]);
    });
  }, [state.pendingCard?.id]);


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
            resolvedQueuedTactic?.window === "beforeMove"
              ? {
                  cardId: resolvedQueuedTactic.cardId,
                  window: resolvedQueuedTactic.window,
                  ...(resolvedQueuedTactic.targets ? { targets: resolvedQueuedTactic.targets } : {}),
                }
              : undefined;
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
  const isPendingTargeting = resolvedTargetingContext?.source === "pending";
  const isTacticTargeting = resolvedTargetingContext?.source === "tactic";
  const dockShort = useCallback((label: string) => shortKey(label), []);
  const dockValue = useCallback((value: string) => shortUnit(value), []);
  const commandDockContent = useMemo(() => {
    const keys = [
      {
        id: "move",
        label: dockShort("MOVE"),
        onClick: () => {
          setMode("MOVE");
          setSelectedAttackerId(null);
        },
        disabled: isGameOver,
        tone: "blue" as const,
        active: mode === "MOVE",
      },
      {
        id: "attack",
        label: dockShort("ATTACK"),
        onClick: () => {
          setMode("ATTACK");
          setSelectedUnitId(null);
        },
        disabled: isGameOver,
        tone: "red" as const,
        active: mode === "ATTACK",
      },
      {
        id: "end",
        label: dockShort("END TURN"),
        onClick: () => dispatch({ type: "END_TURN" }),
        disabled: isGameOver,
        tone: "black" as const,
        accentColor: semanticColors.attack,
        active: !isGameOver,
      },
      {
        id: "draw",
        label: dockShort("DRAW CARD"),
        onClick: () => dispatch({ type: "DRAW_CARD" }),
        disabled: !canDrawCard,
        tone: "neutral" as const,
      },
      {
        id: "next",
        label: dockShort("NEXT PHASE"),
        onClick: () => dispatch({ type: "NEXT_PHASE" }),
        disabled: isGameOver,
        tone: "neutral" as const,
      },
      {
        id: "roll",
        label: dockShort("ROLL DICE"),
        onClick: () => {
          const reaction =
            resolvedQueuedTactic?.window === "beforeAttackRoll"
              ? {
                  cardId: resolvedQueuedTactic.cardId,
                  window: resolvedQueuedTactic.window,
                  ...(resolvedQueuedTactic.targets
                    ? { targets: resolvedQueuedTactic.targets }
                    : {}),
                }
              : undefined;
          dispatch({ type: "ROLL_DICE", ...(reaction ? { reaction } : {}) });
          if (reaction) {
            setQueuedTactic(null);
          }
        },
        disabled: !canRollDice,
        tone: "yellow" as const,
      },
      {
        id: "resolve",
        label: dockShort("RESOLVE ATTACK"),
        onClick: () => {
          const reaction =
            resolvedQueuedTactic &&
            (resolvedQueuedTactic.window === "afterAttackRoll" ||
              resolvedQueuedTactic.window === "beforeDamage")
              ? {
                  cardId: resolvedQueuedTactic.cardId,
                  window: resolvedQueuedTactic.window,
                  ...(resolvedQueuedTactic.targets
                    ? { targets: resolvedQueuedTactic.targets }
                    : {}),
                }
              : undefined;
          dispatch({ type: "RESOLVE_ATTACK", ...(reaction ? { reaction } : {}) });
          if (reaction) {
            setQueuedTactic(null);
          }
        },
        disabled: !canResolveAttack,
        tone: "neutral" as const,
      },
    ];

    if (selectedUnitId || selectedAttackerId || state.pendingAttack) {
      keys.push({
        id: "clear",
        label: dockShort("CLEAR SELECTION"),
        onClick: () => {
          setSelectedUnitId(null);
          setSelectedAttackerId(null);
        },
        disabled: false,
        tone: "neutral" as const,
      });
    }

    return (
      <Stack spacing={1.5}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {keys.map((key) => (
            <ObliqueKey
              key={key.id}
              label={key.label}
              onClick={key.onClick}
              disabled={key.disabled}
              tone={key.tone}
              active={key.active}
              accentColor={key.accentColor}
              size="sm"
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          <StatusCapsule
            label="MODE"
            value={mode}
            compact
            maxWidth={140}
            icon={null}
            tone={mode === "MOVE" ? "blue" : "red"}
          />
          <StatusCapsule label="STATUS" value="READY" compact maxWidth={140} icon={null} />
          <StatusCapsule
            label="SELECTED"
            value={dockValue(selectionLabel)}
            compact
            maxWidth={160}
            icon={null}
          />
          <StatusCapsule
            label="PENDING"
            value={dockValue(pendingAttackLabel)}
            compact
            maxWidth={160}
            icon={null}
          />
          <StatusCapsule
            label="LAST ROLL"
            value={dockValue(lastRollLabel)}
            compact
            maxWidth={160}
            icon={null}
          />
        </Box>
      </Stack>
    );
  }, [
    canDrawCard,
    canResolveAttack,
    canRollDice,
    dockShort,
    dockValue,
    isGameOver,
    lastRollLabel,
    mode,
    pendingAttackLabel,
    resolvedQueuedTactic,
    selectionLabel,
    selectedAttackerId,
    selectedUnitId,
    state.pendingAttack,
  ]);

  function handleCancelTargeting() {
    setTargetingContext(null);
    setSelectedTargetUnitIds([]);
  }

  function handleStartPendingTargeting() {
    if (!state.pendingCard || pendingTargetingSpec?.type !== "unit") {
      return;
    }
    setTargetingContext({ source: "pending", ownerId: state.activePlayer });
    setSelectedUnitId(null);
    setSelectedAttackerId(null);
    setSelectedTargetUnitIds([]);
  }

  function handleConfirmPendingTargets() {
    if (!state.pendingCard) {
      return;
    }
    const targets =
      state.pendingCard.targeting.type === "unit"
        ? { unitIds: resolvedTargetUnitIds }
        : undefined;
    dispatch({ type: "PLAY_CARD", cardId: state.pendingCard.id, targets });
    handleCancelTargeting();
  }

  function handleStartTacticTargeting(cardId: string, window: ReactionWindow) {
    setTargetingContext({ source: "tactic", cardId, window, ownerId: state.activePlayer });
    setSelectedUnitId(null);
    setSelectedAttackerId(null);
    setSelectedTargetUnitIds([]);
  }

  function handleConfirmTacticTargets() {
    if (!tacticTargetingCard || resolvedTargetingContext?.source !== "tactic") {
      return;
    }
    const targets =
      tacticTargetingCard.targeting.type === "unit"
        ? { unitIds: resolvedTargetUnitIds }
        : undefined;
    setQueuedTactic({
      cardId: tacticTargetingCard.id,
      window: resolvedTargetingContext.window,
      ownerId: state.activePlayer,
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
      queuedTactic={
        resolvedQueuedTactic
          ? {
              cardId: resolvedQueuedTactic.cardId,
              window: resolvedQueuedTactic.window,
              ...(resolvedQueuedTactic.targets ? { targets: resolvedQueuedTactic.targets } : {}),
            }
          : null
      }
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
      selectedTargetUnitIds={resolvedTargetUnitIds}
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
        setQueuedTactic({ cardId, window, ownerId: state.activePlayer });
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
        bgcolor: "var(--surface2)",
        color: "text.primary",
        overflow: "hidden",
      }}
    ><SkewedTabsConditional />
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
          backgroundColor: "var(--surface2)",
        }}
      >
        <CommandHeader
          variant={landscapeMode ? "landscape" : "default"}
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
          canRollDice={canRollDice}
          canResolveAttack={canResolveAttack}
          isGameOver={isGameOver}
          hasSelection={Boolean(selectedUnitId || selectedAttackerId || state.pendingAttack)}
          showConsoleToggle={isNarrow}
          onToggleConsole={() => setIsConsoleOpen((prev) => !prev)}
          onOpenDockCmd={openDockCmd}
          onOpenDockConsole={openDockConsole}
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
              resolvedQueuedTactic?.window === "beforeAttackRoll"
                ? {
                    cardId: resolvedQueuedTactic.cardId,
                    window: resolvedQueuedTactic.window,
                    ...(resolvedQueuedTactic.targets
                      ? { targets: resolvedQueuedTactic.targets }
                      : {}),
                  }
                : undefined;
            dispatch({ type: "ROLL_DICE", ...(reaction ? { reaction } : {}) });
            if (reaction) {
              setQueuedTactic(null);
            }
          }}
          onResolveAttack={() => {
            const reaction =
              resolvedQueuedTactic &&
              (resolvedQueuedTactic.window === "afterAttackRoll" ||
                resolvedQueuedTactic.window === "beforeDamage")
                ? {
                    cardId: resolvedQueuedTactic.cardId,
                    window: resolvedQueuedTactic.window,
                    ...(resolvedQueuedTactic.targets
                      ? { targets: resolvedQueuedTactic.targets }
                      : {}),
                  }
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
        {!landscapeMode ? (
          <PhaseRuler phase={state.phase} compact={isNarrow} hideTopBorder />
        ) : null}
      </Box>

      <Box
        sx={{
          flex: landscapeMode ? "0 0 auto" : 1,
          height: landscapeMode ? `calc(100dvh - ${commandBarHeight}px)` : "auto",
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

      {landscapeMode ? (
        <EdgeCommandDock
          open={dockOpen}
          pinned={dockPinned}
          tab={dockTab}
          onOpenChange={(open) => {
            handleDockInteract();
            setDockOpen(open);
          }}
          onPinnedChange={(next) => {
            handleDockInteract();
            setDockPinned(next);
          }}
          onTabChange={(tab) => {
            handleDockInteract();
            setDockTab(tab);
          }}
          topOffset={commandBarHeight}
          cmdContent={commandDockContent}
          consoleContent={opsConsole(false, {
            activeTab: resolvedConsoleTab,
            onTabChange: (tab) => {
              if (!SHOW_DEV_LOGS && tab === "log") {
                return;
              }
              setConsoleTab(tab);
            },
            showHeader: false,
            showTabs: true,
            scrollMode: "body",
          })}
          onUserInteract={handleDockInteract}
        />
      ) : null}

      {isNarrow && !landscapeMode ? (
        <MobileConsoleDrawer
          key={consoleOpen ? "open" : "closed"}
          open={consoleOpen}
          onOpenChange={setIsConsoleOpen}
          topOffset={commandBarHeight}
          header={
            <Plate accentColor={playerStripe} sx={{ width: "100%", px: 2, py: 1 }}>
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
                activeId={resolvedConsoleTab}
                onChange={(id) => {
                  if (!SHOW_DEV_LOGS && id === "log") {
                    return;
                  }
                  setConsoleTab(id as "cards" | "tactics" | "log");
                }}
                size="md"
              />
              <Box sx={{ borderBottom: "2px solid #1B1B1B", mt: 0.5 }} />
            </>
          }
          body={opsConsole(false, {
            activeTab: resolvedConsoleTab,
            onTabChange: (tab) => {
              if (!SHOW_DEV_LOGS && tab === "log") {
                return;
              }
              setConsoleTab(tab);
            },
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
            tone="focus"
            accent="yellow"
            rightActions={null}
          >
            <Box sx={{ pt: 1 }}>
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
                      SELECTED {resolvedTargetUnitIds.length}/{targetingSpec.count}
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
                        resolvedTargetUnitIds.length !== pendingTargetingSpec.count
                      }
                      tone="black"
                      active
                      size="sm"
                    />
                  ) : (
                    <ObliqueKey
                      label="CONFIRM"
                      onClick={handleConfirmTacticTargets}
                      disabled={
                        targetingSpec?.type !== "unit" ||
                        resolvedTargetUnitIds.length !== targetingSpec.count
                      }
                      tone="black"
                      active
                      size="sm"
                    />
                  )}
                  <ObliqueKey
                    label="CANCEL"
                    onClick={handleCancelTargeting}
                    tone="neutral"
                    active
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
