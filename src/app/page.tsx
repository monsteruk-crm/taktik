"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type {
  CardDefinition,
  GameBootstrap,
  Player,
  ReactionWindow,
  TerrainResult,
} from "@/lib/engine";
import {
  createInitialGameStateFromBootstrap,
  createLoadingGameState,
  gameReducer,
  getOpenReactionWindows,
  prepareGameBootstrap,
} from "@/lib/engine";
import { formatTerrainStats, generateTerrainBiomes, generateTerrainNetworks } from "@/lib/engine/terrain";
import {
  getInitialRngSeed,
  initialTerrainParams,
  initialTerrainSquarePenalties,
} from "@/lib/settings";
import { getMoveRange } from "@/lib/engine/movement";
import BoardSurface from "@/components/BoardSurface";
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
import CardDrawOverlay from "@/components/ui/CardDrawOverlay";
import PhaseStatusStrip from "@/components/ui/PhaseStatusStrip";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";
import { shortKey, shortPhase, shortUnit } from "@/lib/ui/headerFormat";
import { GAP_SM } from "@/lib/ui/layoutTokens";
import { semanticColors } from "@/lib/ui/semanticColors";
import { buildContext } from "@/lib/engine/effects";
import { TERRAIN_DEBUG_COLORS, TERRAIN_ORDER } from "@/lib/ui/terrain";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";

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

  const initialSeed = useMemo(() => getInitialRngSeed(), []);
  const initialBootstrap = useMemo(() => prepareGameBootstrap(initialSeed), [initialSeed]);
  const [state, dispatch] = useReducer(
    gameReducer,
    initialBootstrap,
    createLoadingGameState
  );
  const [mode, setMode] = useState<"MOVE" | "ATTACK">("MOVE");
  const [terrainStatus, setTerrainStatus] = useState<
    "loading" | "ready" | "error" | "cancelled"
  >("loading");
  const terrainWorkerRef = useRef<Worker | null>(null);
  const lastSeedRef = useRef<number>(initialSeed);
  const terrainStartDelayRef = useRef<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [targetingContext, setTargetingContext] = useState<TargetingContext | null>(null);
  const targetingContextRef = useRef<TargetingContext | null>(null);
  const [selectedTargetUnitIds, setSelectedTargetUnitIds] = useState<string[]>([]);
  const [queuedTactic, setQueuedTactic] = useState<QueuedTactic | null>(null);
  const [cardDrawOverlay, setCardDrawOverlay] = useState<CardDefinition | null>(null);
  const isNarrow = useMediaQuery("(max-width:1100px)");
  const isTiny = useMediaQuery("(max-width:420px)");
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const isShort = useMediaQuery("(max-height:520px)");
  const [mediaReady, setMediaReady] = useState(false);
  const [uiReveal, setUiReveal] = useState(false);
  const terrainReady = terrainStatus === "ready";
  const uiRevealMs = 400;
  const uiIsNarrow = mediaReady ? isNarrow : true;
  const uiIsTiny = mediaReady ? isTiny : true;
  const uiIsLandscape = mediaReady ? isLandscape : false;
  const uiIsShort = mediaReady ? isShort : false;
  const landscapeMode = uiIsNarrow && uiIsLandscape && uiIsShort;
  const headerVp = "--";
  const showMobileStatsOverlay = uiIsNarrow && !landscapeMode && terrainReady;
  const showHeaderExtras = !uiIsNarrow || terrainReady;
  const showVpInOverlay = !uiIsTiny;
  const mobilePhaseLabel = shortPhase(state.phase);
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
  const canMove = terrainReady && state.phase === "MOVEMENT" && !isGameOver;
  const canAttack = terrainReady && state.phase === "ATTACK" && !isGameOver;
  const canRollDice =
    terrainReady &&
    state.phase === "DICE_RESOLUTION" &&
    !!state.pendingAttack &&
    !state.lastRoll &&
    !isGameOver;
  const canResolveAttack =
    terrainReady &&
    state.phase === "DICE_RESOLUTION" &&
    !!state.pendingAttack &&
    !!state.lastRoll &&
    !isGameOver;
  const canDrawCard = terrainReady && !isGameOver && !state.pendingCard;
  const canStoreBonus =
    terrainReady &&
    !isGameOver &&
    state.pendingCard?.kind === "bonus" &&
    state.storedBonuses.length < 6;
  const canPlayCard = terrainReady && !isGameOver && !!state.pendingCard;
  const moveRange = useMemo(() => {
    if (mode !== "MOVE" || !selectedUnitId) {
      return [];
    }
    return getMoveRange(state, selectedUnitId);
  }, [mode, selectedUnitId, state]);
  const pendingTargetingSpec = state.pendingCard?.targeting ?? null;
  const pendingTargetingMinCount =
    pendingTargetingSpec?.type === "unit" ? pendingTargetingSpec.count : 0;
  const pendingTargetingMaxCount =
    pendingTargetingSpec?.type === "unit"
      ? pendingTargetingSpec.maxCount ?? pendingTargetingSpec.count
      : 0;
  const tacticById = useMemo(() => {
    return new Map(state.selectedTacticalDeck.map((card) => [card.id, card]));
  }, [state.selectedTacticalDeck]);
  const openReactionWindows = useMemo(() => getOpenReactionWindows(state), [state]);
  const SHOW_DEV_LOGS = process.env.NEXT_PUBLIC_SHOW_DEV_LOGS === "true";
  const SHOW_TERRAIN_DEBUG = process.env.NEXT_PUBLIC_TERRAIN_DEBUG === "true";
  const resolvedConsoleTab =
    !SHOW_DEV_LOGS && consoleTab === "log" ? "cards" : consoleTab;
  const consoleOpen = uiIsNarrow && !landscapeMode ? isConsoleOpen : false;
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
  const targetingMinCount =
    targetingSpec?.type === "unit" ? targetingSpec.count : 0;
  const targetingMaxCount =
    targetingSpec?.type === "unit"
      ? targetingSpec.maxCount ?? targetingSpec.count
      : 0;
  const isTargeting = !!resolvedTargetingContext;
  const resolvedTargetUnitIds = isTargeting ? selectedTargetUnitIds : [];
  const tacticTargetingCard =
    resolvedTargetingContext?.source === "tactic"
      ? tacticById.get(resolvedTargetingContext.cardId) ?? null
      : null;

  const startTerrainWorker = useCallback(
    (bootstrap: GameBootstrap) => {
      if (typeof window === "undefined") {
        return;
      }
      setTerrainStatus("loading");
      const fallbackToMainThread = () => {
        try {
          const networks = generateTerrainNetworks({
            width: state.boardWidth,
            height: state.boardHeight,
            seed: bootstrap.terrainSeed,
            roadDensity: initialTerrainParams.roadDensity,
            riverDensity: initialTerrainParams.riverDensity,
            maxBridges: initialTerrainParams.maxBridges,
            extraBridgeEvery: initialTerrainParams.extraBridgeEvery,
            extraBridgeMinSpacing: initialTerrainParams.extraBridgeMinSpacing,
            penalties: initialTerrainSquarePenalties,
          });
          const biomes = generateTerrainBiomes({
            width: state.boardWidth,
            height: state.boardHeight,
            seed: networks.nextSeed,
            rivers: networks.river,
            roads: networks.road,
          });
          if (SHOW_TERRAIN_DEBUG) {
            console.info("Terrain biome stats\n" + formatTerrainStats(biomes.stats));
          }
          const terrain = {
            road: networks.road,
            river: networks.river,
            biomes: biomes.biomes,
            stats: biomes.stats,
            nextSeed: biomes.nextSeed,
          };
          const nextState = createInitialGameStateFromBootstrap({
            bootstrap,
            terrain,
          });
          dispatch({ type: "LOAD_STATE", state: nextState });
          setTerrainStatus("ready");
          return true;
        } catch (error) {
          return false;
        }
      };

      // Dev-only: when terrain debug is enabled, always run on the main thread.
      // Next dev server does not reliably hot-reload worker bundles, which can make
      // biome counts appear "stuck" even after code changes.
      if (SHOW_TERRAIN_DEBUG) {
        const recovered = fallbackToMainThread();
        if (!recovered) {
          setTerrainStatus("error");
        }
        return;
      }

      if (terrainWorkerRef.current) {
        terrainWorkerRef.current.terminate();
      }
      const worker = new Worker(
        new URL("../workers/terrainWorker.ts", import.meta.url)
      );
      terrainWorkerRef.current = worker;
      worker.onmessage = (event: MessageEvent<{ terrain: TerrainResult }>) => {
        const nextState = createInitialGameStateFromBootstrap({
          bootstrap,
          terrain: event.data.terrain,
        });
        dispatch({ type: "LOAD_STATE", state: nextState });
        setTerrainStatus("ready");
        worker.terminate();
        if (terrainWorkerRef.current === worker) {
          terrainWorkerRef.current = null;
        }
      };
      worker.onerror = () => {
        const recovered = fallbackToMainThread();
        if (!recovered) {
          setTerrainStatus("error");
        }
        worker.terminate();
        if (terrainWorkerRef.current === worker) {
          terrainWorkerRef.current = null;
        }
      };
      worker.postMessage({
        width: state.boardWidth,
        height: state.boardHeight,
        seed: bootstrap.terrainSeed,
        roadDensity: initialTerrainParams.roadDensity,
        riverDensity: initialTerrainParams.riverDensity,
        maxBridges: initialTerrainParams.maxBridges,
        extraBridgeEvery: initialTerrainParams.extraBridgeEvery,
        extraBridgeMinSpacing: initialTerrainParams.extraBridgeMinSpacing,
        penalties: initialTerrainSquarePenalties,
        debugTerrain: SHOW_TERRAIN_DEBUG,
      });
    },
    [SHOW_TERRAIN_DEBUG, state.boardHeight, state.boardWidth]
  );


  const requestNewGame = useCallback(
    (seed: number) => {
      const bootstrap = prepareGameBootstrap(seed >>> 0);
      lastSeedRef.current = seed >>> 0;
      dispatch({ type: "LOAD_STATE", state: createLoadingGameState(bootstrap) });
      if (terrainStartDelayRef.current) {
        window.clearTimeout(terrainStartDelayRef.current);
      }
      terrainStartDelayRef.current = window.setTimeout(() => {
        startTerrainWorker(bootstrap);
        terrainStartDelayRef.current = null;
      }, 1000);
    },
    [startTerrainWorker]
  );

  const cancelTerrainWorker = useCallback(() => {
    if (terrainWorkerRef.current) {
      terrainWorkerRef.current.terminate();
      terrainWorkerRef.current = null;
    }
    setTerrainStatus("cancelled");
  }, []);

  const retryTerrainWorker = useCallback(() => {
    requestNewGame(lastSeedRef.current);
  }, [requestNewGame]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (process.env.NEXT_PUBLIC_RNG_SEED) {
      requestNewGame(initialSeed);
      return;
    }
    const randomSeed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    requestNewGame(randomSeed);
  }, [initialSeed, requestNewGame]);

  useEffect(() => {
    return () => {
      if (terrainWorkerRef.current) {
        terrainWorkerRef.current.terminate();
      }
      if (terrainStartDelayRef.current) {
        window.clearTimeout(terrainStartDelayRef.current);
      }
    };
  }, []);
  const targetableTiles = useMemo(() => {
    if (!isTargeting || targetingSpec?.type !== "unit") {
      return [];
    }
    const targetOwner =
      targetingSpec.owner === "self"
        ? state.activePlayer
        : state.activePlayer === "PLAYER_A"
          ? "PLAYER_B"
          : "PLAYER_A";
    return state.units
      .filter((unit) => unit.owner === targetOwner)
      .map((unit) => unit.position);
  }, [isTargeting, targetingSpec, state.activePlayer, state.units]);
  const attackableTiles = useMemo(() => {
    if (mode !== "ATTACK" || !selectedAttackerId || !canAttack) {
      return [];
    }
    const attacker = state.units.find((unit) => unit.id === selectedAttackerId);
    if (!attacker) {
      return [];
    }
    const opponent = attacker.owner === "PLAYER_A" ? "PLAYER_B" : "PLAYER_A";
    return state.units
      .filter((unit) => {
        if (unit.owner !== opponent) {
          return false;
        }
        const distance =
          Math.abs(attacker.position.x - unit.position.x) +
          Math.abs(attacker.position.y - unit.position.y);
        if (distance === 0 || distance > attacker.attack) {
          return false;
        }
        return state.activeEffects.every((effect) => {
          const ctx = buildContext(state, effect);
          return effect.hooks.canAttack?.(ctx, attacker.id, unit.id) ?? true;
        });
      })
      .map((unit) => unit.position);
  }, [canAttack, mode, selectedAttackerId, state]);

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
      if (!landscapeMode || dockPinned || !terrainReady) {
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
    [dockPinned, landscapeMode, scheduleDockAutoClose, terrainReady]
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

  useEffect(() => {
    setMediaReady(true);
  }, []);

  useEffect(() => {
    if (!terrainReady) {
      setUiReveal(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      setUiReveal(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [terrainReady]);

  useEffect(() => {
    if (terrainReady) {
      return;
    }
    if (isNarrow && !landscapeMode) {
      setIsConsoleOpen(false);
    }
    if (landscapeMode) {
      setDockOpen(false);
      setDockPinned(false);
    }
  }, [isNarrow, landscapeMode, terrainReady]);

  const unitByPosition = useMemo(() => {
    const map = new Map<string, string>();
    for (const unit of state.units) {
      map.set(`${unit.position.x},${unit.position.y}`, unit.id);
    }
    return map;
  }, [state.units]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const logRowHeight = 18;
  const reducedMotion = useReducedMotion();
  const handleCardOverlayComplete = useCallback(() => {
    setCardDrawOverlay(null);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  useEffect(() => {
    setSelectedUnitId(null);
    setSelectedAttackerId(null);
  }, [state.activePlayer]);

  useEffect(() => {
    if (consoleOpen && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [consoleOpen]);

  const prevPendingCardIdRef = useRef<string | null>(null);
  const lastDrawnCardIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!state.pendingCard) {
      return;
    }
    if (lastDrawnCardIdRef.current === state.pendingCard.id) {
      return;
    }
    lastDrawnCardIdRef.current = state.pendingCard.id;
    setCardDrawOverlay(state.pendingCard);
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
        const maxCount = targetingSpec.maxCount ?? targetingSpec.count;
        if (current.length >= maxCount) {
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
        const unit = state.units.find((item) => item.id === unitId);
        if (!unit || unit.owner !== state.activePlayer) {
          return;
        }
        setSelectedAttackerId(unitId);
      }
      return;
    }

    if (unitId) {
      if (unitId === selectedAttackerId) {
        setSelectedAttackerId(null);
        return;
      }
      const target = state.units.find((item) => item.id === unitId);
      if (!target || target.owner === state.activePlayer) {
        return;
      }
      dispatch({ type: "ATTACK_SELECT", attackerId: selectedAttackerId, targetId: unitId });
      setSelectedAttackerId(null);
    }
  }

  const selectionLabel =
    mode === "MOVE" ? selectedUnitId ?? "None" : selectedAttackerId ?? "None";
  const pendingAttackLabel = state.pendingAttack
    ? `${state.pendingAttack.attackerId} -> ${state.pendingAttack.targetId}`
    : state.attackQueue.length > 0
      ? `${state.attackQueue.length} QUEUED`
      : "None";
  const lastRollLabel = state.lastRoll
    ? `${state.lastRoll.value} -> ${state.lastRoll.outcome}`
    : "None";
  const isPendingTargeting = resolvedTargetingContext?.source === "pending";
  const isTacticTargeting = resolvedTargetingContext?.source === "tactic";
  const dockShort = useCallback((label: string) => shortKey(label), []);
  const dockValue = useCallback((value: string) => shortUnit(value), []);
  type DockKey = {
    id: string;
    label: string;
    onClick: () => void;
    disabled: boolean;
    tone: "neutral" | "blue" | "red" | "yellow" | "black";
    active?: boolean;
    accentColor?: string;
    cutout?: "move" | "attack";
    startIcon?: ReactNode;
    endIcon?: ReactNode;
  };

  const commandDockContent = useMemo(() => {
    const keys: DockKey[] = [
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
        startIcon: <KeyboardDoubleArrowRightIcon fontSize="small" />,
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
        startIcon: <ElectricBoltIcon fontSize="small" />,
      },
      {
        id: "end",
        label: dockShort("END TURN"),
        onClick: () => dispatch({ type: "END_TURN" }),
        disabled: isGameOver,
        tone: "black" as const,
        accentColor: semanticColors.attack,
        active: !isGameOver,
        startIcon: <StopCircleIcon fontSize="small" />,
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
        startIcon: <PlayCircleOutlineIcon fontSize="small" />,
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

    if (selectedUnitId || selectedAttackerId || state.pendingAttack || state.attackQueue.length > 0) {
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
          {keys.map((key: DockKey) => (
            <ObliqueKey
              key={key.id}
              label={key.label}
              onClick={key.onClick}
              disabled={key.disabled}
              tone={key.tone}
              active={key.active}
              accentColor={key.accentColor}
              cutout={key.cutout}
              startIcon={key.startIcon}
              endIcon={key.endIcon}
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
    state.attackQueue.length,
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
      suppressPendingArt={Boolean(cardDrawOverlay)}
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
    >
      {terrainReady ? (
        <Box
          component="header"
          ref={headerRef}
          sx={{
            px: 0,
            py: 0,
            display: "grid",
            gap: 0,
            position: uiIsNarrow ? "sticky" : "relative",
            top: 0,
            zIndex: 20,
            backgroundColor: "var(--surface2)",
            opacity: uiReveal ? 1 : 0,
            transition: reducedMotion ? "none" : `opacity ${uiRevealMs}ms ${EASE.stiff}`,
            pointerEvents: uiReveal ? "auto" : "none",
          }}
        >
          <CommandHeader
            variant={landscapeMode ? "landscape" : "default"}
            isNarrow={uiIsNarrow}
            isTiny={uiIsTiny}
            player={state.activePlayer}
            turn={state.turn}
            phase={state.phase}
            vp={headerVp}
            mode={mode}
            status="READY"
            selectionLabel={selectionLabel}
            pendingAttackLabel={pendingAttackLabel}
            lastRollLabel={lastRollLabel}
            canDrawCard={canDrawCard}
            canRollDice={canRollDice}
            canResolveAttack={canResolveAttack}
            isGameOver={isGameOver}
            hasSelection={Boolean(
              selectedUnitId ||
              selectedAttackerId ||
              state.pendingAttack ||
              state.attackQueue.length > 0
            )}
            showStatusStrip={showHeaderExtras && !showMobileStatsOverlay}
            showPhaseControls={showHeaderExtras && !showMobileStatsOverlay}
            showCommandPanels={showHeaderExtras}
            showConsoleToggle={uiIsNarrow && terrainReady}
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
          {!landscapeMode && showHeaderExtras ? (
            <PhaseRuler phase={state.phase} compact={uiIsNarrow} hideTopBorder />
          ) : null}
        </Box>
      ) : null}

      <Box
        sx={{
          flex: landscapeMode ? "0 0 auto" : 1,
          height: landscapeMode ? `calc(100dvh - ${commandBarHeight}px)` : "auto",
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >

          <Box sx={{ flex: 1, padding:"8px", minWidth: 0, minHeight: 0, position: "relative" }}>
            <BoardSurface
              state={state}
              mode={mode}
              selectedUnitId={selectedUnitId}
              selectedAttackerId={selectedAttackerId}
              moveRange={moveRange}
              targetableTiles={targetableTiles}
              attackableTiles={attackableTiles}
              terrainReady={terrainReady}
              showTerrainDebug={SHOW_TERRAIN_DEBUG}
              onTileClick={handleTileClick}
            />
            {SHOW_TERRAIN_DEBUG && terrainReady ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  zIndex: 12,
                  pointerEvents: "auto",
                  width: 260,
                  maxWidth: "calc(100% - 32px)",
                }}
              >
                <OverlayPanel title="TERRAIN DEBUG" tone="info" accent="blue">
                  <Stack spacing={1}>
                    <Typography variant="caption" fontWeight={700}>
                      CELL COUNTS / REGIONS
                    </Typography>
                    <Stack spacing={0.75}>
                      {TERRAIN_ORDER.map((type) => {
                        const count = state.terrain.stats?.counts[type] ?? 0;
                        const regions = state.terrain.stats?.regions[type] ?? 0;
                        return (
                          <Stack
                            key={type}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 14,
                                  height: 14,
                                  border: "1px solid #1B1B1B",
                                  backgroundColor: TERRAIN_DEBUG_COLORS[type],
                                }}
                              />
                              <Typography variant="caption">{type}</Typography>
                            </Stack>
                            <Typography variant="caption">
                              {count} / {regions}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Stack>
                </OverlayPanel>
              </Box>
            ) : null}
            {showMobileStatsOverlay ? (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  zIndex: 13,
                  pointerEvents: "none",
                  width: "min(260px, calc(100% - 32px))",
                  opacity: uiReveal ? 1 : 0,
                  transition: reducedMotion ? "none" : `opacity ${uiRevealMs}ms ${EASE.stiff}`,
                }}
              >
                <PhaseStatusStrip
                  vp={headerVp}
                  showVp={showVpInOverlay}
                  turn={state.turn}
                  phaseLabel={mobilePhaseLabel}
                  compact
                  wrap
                />
              </Box>
            ) : null}
            {showMobileStatsOverlay ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  zIndex: 13,
                  pointerEvents: "auto",
                  display: "flex",
                  gap: `${GAP_SM}px`,
                  opacity: uiReveal ? 1 : 0,
                  transition: reducedMotion ? "none" : `opacity ${uiRevealMs}ms ${EASE.stiff}`,
                }}
              >
                <ObliqueKey
                  label={shortKey("NEXT PHASE")}
                  onClick={() => dispatch({ type: "NEXT_PHASE" })}
                  disabled={isGameOver}
                  tone="neutral"
                  size="sm"
                  startIcon={<PlayCircleOutlineIcon fontSize="small" />}
                />
                <ObliqueKey
                  label={shortKey("END TURN")}
                  onClick={() => dispatch({ type: "END_TURN" })}
                  disabled={isGameOver}
                  tone="black"
                  active={!isGameOver}
                  accentColor={semanticColors.attack}
                  size="sm"
                  startIcon={<StopCircleIcon fontSize="small" />}
                />
              </Box>
            ) : null}
            {terrainStatus !== "ready" ? (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "auto",
                }}
              >
                <OverlayPanel title="MAP RENDERING" tone="focus" accent="yellow">
                  <Stack spacing={2}>
                    {terrainStatus === "loading" ? (
                      <Stack direction="row" spacing={2} alignItems="center">
                        <CircularProgress enableTrackSlot size={40} />
                        <Stack spacing={0.5}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Map rendering in progress.
                          </Typography>
                          <Typography variant="body2">
                            Generating terrain networks in a background worker.
                          </Typography>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Map rendering halted.
                        </Typography>
                        <Typography variant="body2">
                          {terrainStatus === "error"
                            ? "Worker failed to respond. You can retry or regenerate."
                            : "Rendering was cancelled. You can retry or regenerate."}
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" spacing={1.5}>
                      {terrainStatus === "loading" ? (
                        <ObliqueKey
                          label="CANCEL"
                          onClick={cancelTerrainWorker}
                          tone="neutral"
                          size="sm"
                        />
                      ) : (
                        <>
                          <ObliqueKey
                            label="RETRY"
                            onClick={retryTerrainWorker}
                            tone="yellow"
                            size="sm"
                          />
                          <ObliqueKey
                            label="NEW SEED"
                            onClick={() =>
                              requestNewGame(Math.floor(Math.random() * 0xffffffff) >>> 0)
                            }
                            tone="neutral"
                            size="sm"
                          />
                        </>
                      )}
                    </Stack>
                  </Stack>
                </OverlayPanel>
              </Box>
            ) : null}
          </Box>

        <Box
          sx={{
            width: 420,
            display: !terrainReady || uiIsNarrow ? "none" : "flex",
            borderLeft: "2px solid #1B1B1B",
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
            opacity: uiReveal ? 1 : 0,
            transition: reducedMotion ? "none" : `opacity ${uiRevealMs}ms ${EASE.stiff}`,
            pointerEvents: uiReveal ? "auto" : "none",
          }}
        >
          {opsConsole(true)}
        </Box>
      </Box>

      {landscapeMode && terrainReady ? (
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

      {uiIsNarrow && !landscapeMode && terrainReady ? (
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

      {cardDrawOverlay ? (
        <CardDrawOverlay
          card={cardDrawOverlay}
          reducedMotion={reducedMotion}
          onComplete={handleCardOverlayComplete}
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
                      SELECTED {resolvedTargetUnitIds.length}/{targetingMaxCount}
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
                        resolvedTargetUnitIds.length < pendingTargetingMinCount ||
                        resolvedTargetUnitIds.length > pendingTargetingMaxCount
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
                        resolvedTargetUnitIds.length < targetingMinCount ||
                        resolvedTargetUnitIds.length > targetingMaxCount
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
