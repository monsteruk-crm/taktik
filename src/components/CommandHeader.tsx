"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ObliqueKey from "@/components/ui/ObliqueKey";
import Plate from "@/components/ui/Plate";
import StatusCapsule from "@/components/ui/StatusCapsule";
import PhaseStatusStrip from "@/components/ui/PhaseStatusStrip";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";
import { shortKey, shortPhase, shortUnit } from "@/lib/ui/headerFormat";
import { BORDER, GAP_MD, GAP_SM, PAD } from "@/lib/ui/layoutTokens";
import { semanticColors } from "@/lib/ui/semanticColors";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";

type KeyConfig = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "blue" | "red" | "yellow" | "black";
  active?: boolean;
  accentColor?: string;
  cutout?: "move" | "attack";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

type CommandHeaderProps = {
  variant?: "default" | "landscape";
  isNarrow: boolean;
  isTiny: boolean;
  player: string;
  turn: number;
  phase: string;
  vp?: number | string;
  mode: "MOVE" | "ATTACK";
  status: string;
  selectionLabel: string;
  pendingAttackLabel: string;
  lastRollLabel: string;
  canDrawCard: boolean;
  canRollDice: boolean;
  canResolveAttack: boolean;
  isGameOver: boolean;
  hasSelection: boolean;
  showStatusStrip?: boolean;
  showPhaseControls?: boolean;
  showCommandPanels?: boolean;
  showConsoleToggle: boolean;
  onToggleConsole: () => void;
  onOpenDockCmd?: () => void;
  onOpenDockConsole?: () => void;
  onDrawCard: () => void;
  onMove: () => void;
  onAttack: () => void;
  onNextPhase: () => void;
  onEndTurn: () => void;
  onRollDice: () => void;
  onResolveAttack: () => void;
  onClearSelection: () => void;
};

export default function CommandHeader({
  variant = "default",
  isNarrow,
  isTiny,
  player,
  turn,
  phase,
  vp = "--",
  mode,
  status,
  selectionLabel,
  pendingAttackLabel,
  lastRollLabel,
  canDrawCard,
  canRollDice,
  canResolveAttack,
  isGameOver,
  hasSelection,
  showStatusStrip = true,
  showPhaseControls = true,
  showCommandPanels = true,
  showConsoleToggle,
  onToggleConsole,
  onOpenDockCmd,
  onOpenDockConsole,
  onDrawCard,
  onMove,
  onAttack,
  onNextPhase,
  onEndTurn,
  onRollDice,
  onResolveAttack,
  onClearSelection,
}: CommandHeaderProps) {
  const reducedMotion = useReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const quickTimerRef = useRef<number | null>(null);
  const quickHideRef = useRef<number | null>(null);
  const keySize = isNarrow ? "sm" : "md";
  const phaseLabel = isNarrow ? shortPhase(phase) : phase;
  const showVp = !isTiny;
  const playerStripe =
    player === "PLAYER_A" ? semanticColors.playerA : semanticColors.playerB;
  const playerTone = player === "PLAYER_A" ? "blue" : "red";
  const normalizedPhase = phase.toUpperCase();
  const isActionPhase =
    normalizedPhase.includes("MOVE") || normalizedPhase.includes("ATTACK");
  const isDrawPhase = normalizedPhase.includes("DRAW");
  const isDicePhase = normalizedPhase.includes("DICE");

  const shortLabel = useCallback(
    (label: string) => (isTiny ? shortKey(label) : label),
    [isTiny]
  );

  const rowA: KeyConfig[] = [
    {
      id: "move",
      label: shortLabel("MOVE"),
      onClick: onMove,
      disabled: isGameOver || !isActionPhase,
      tone: "blue",
      active: isActionPhase && mode === "MOVE",
      startIcon: (
        <KeyboardDoubleArrowRightIcon
          fontSize={keySize === "sm" ? "small" : "medium"}
        />
      ),
    },
    {
      id: "attack",
      label: shortLabel("ATTACK"),
      onClick: onAttack,
      disabled: isGameOver || !isActionPhase,
      tone: "red",
      active: isActionPhase && mode === "ATTACK",
      startIcon: (
        <ElectricBoltIcon
          fontSize={keySize === "sm" ? "small" : "medium"}
        />
      ),
    },
  ];

  const actionKeys = useMemo(() => {
    const list: KeyConfig[] = [];
    if (canDrawCard && isDrawPhase) {
      list.push({
        id: "draw",
        label: shortLabel("DRAW CARD"),
        onClick: onDrawCard,
        tone: "neutral",
      });
    }
    if (canRollDice && isDicePhase) {
      list.push({
        id: "roll",
        label: shortLabel("ROLL DICE"),
        onClick: onRollDice,
        tone: "yellow",
        active: true,
      });
    }
    if (canResolveAttack && isDicePhase) {
      list.push({
        id: "resolve",
        label: shortLabel("RESOLVE ATTACK"),
        onClick: onResolveAttack,
        tone: "neutral",
      });
    }
    if (hasSelection && isActionPhase) {
      list.push({
        id: "clear",
        label: shortLabel("CLEAR SELECTION"),
        onClick: onClearSelection,
        tone: "neutral",
      });
    }
    return list;
  }, [
    canDrawCard,
    canResolveAttack,
    canRollDice,
    hasSelection,
    isActionPhase,
    isDicePhase,
    isDrawPhase,
    onClearSelection,
    onDrawCard,
    onResolveAttack,
    onRollDice,
    shortLabel,
  ]);

  const { rowB, overflow } = useMemo(() => {
    const keys = [...actionKeys];
    const overflowed: KeyConfig[] = [];
    const maxRowB = isTiny ? 2 : 4;
    while (keys.length > maxRowB) {
      overflowed.push(keys.pop() as KeyConfig);
    }
    return { rowB: keys, overflow: overflowed };
  }, [actionKeys, isTiny]);

  const secondaryCollapsed = useMemo(() => {
    if (selectionLabel !== "None") {
      return { label: "SELECTED", value: selectionLabel };
    }
    if (pendingAttackLabel !== "None") {
      return { label: "PENDING", value: pendingAttackLabel };
    }
    return { label: "SELECTED", value: selectionLabel };
  }, [pendingAttackLabel, selectionLabel]);

  const capsuleValue = (value: string) => (isNarrow ? shortUnit(value) : value);

  const handleQuickReveal = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }
    if (quickTimerRef.current) {
      window.clearTimeout(quickTimerRef.current);
    }
    quickTimerRef.current = window.setTimeout(() => {
      setQuickOpen(true);
      if (quickHideRef.current) {
        window.clearTimeout(quickHideRef.current);
      }
      quickHideRef.current = window.setTimeout(() => {
        setQuickOpen(false);
      }, 1500);
    }, 350);
  };

  const clearQuickReveal = () => {
    if (quickTimerRef.current) {
      window.clearTimeout(quickTimerRef.current);
      quickTimerRef.current = null;
    }
  };

  const dismissQuick = () => {
    if (quickHideRef.current) {
      window.clearTimeout(quickHideRef.current);
      quickHideRef.current = null;
    }
    setQuickOpen(false);
  };

  useEffect(() => {
    return () => {
      if (quickTimerRef.current) {
        window.clearTimeout(quickTimerRef.current);
      }
      if (quickHideRef.current) {
        window.clearTimeout(quickHideRef.current);
      }
    };
  }, []);

  if (variant === "landscape") {
    const activePhaseLabel = shortPhase(phase);
    return (
      <Box
        onPointerDown={handleQuickReveal}
        onPointerUp={clearQuickReveal}
        onPointerCancel={clearQuickReveal}
        sx={{
          backgroundColor: "var(--surface2)",
          borderBottom: `${BORDER}px solid #1B1B1B`,
          px: `${PAD}px`,
          py: `${GAP_SM}px`,
          minHeight: 48,
          display: "grid",
          gridTemplateColumns: "max-content minmax(0, 1fr) max-content",
          alignItems: "center",
          gap: `${GAP_SM}px`,
          position: "relative",
        }}
      >
        <StatusCapsule
          label="PLAYER"
          value={player}
          compact
          maxWidth={120}
          icon={null}
          tone={playerTone}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: `${GAP_SM}px`,
            minWidth: 0,
          }}
        >
          <Typography variant="caption" fontWeight={800}>
            {shortPhase(phase)}
          </Typography>
          <Typography variant="caption">T{turn}</Typography>
          <Box
            aria-hidden="true"
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 2,
              height: 8,
              width: 72,
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => {
              const phaseIndex = Math.max(0, Math.min(5, Math.floor(index)));
              const isActive =
                activePhaseLabel ===
                ["TURN", "DRAW", "MOVE", "ATK", "DICE", "END"][phaseIndex];
              return (
                <Box
                  key={`mini-${index}`}
                  sx={{
                    border: "1px solid #1B1B1B",
                    backgroundColor: isActive ? "#1B1B1B" : "var(--action-panel)",
                  }}
                />
              );
            })}
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <ObliqueKey
            label="CONSOLE"
            onClick={onOpenDockConsole ?? onToggleConsole}
            tone="neutral"
            size="sm"
          />
          <ObliqueKey
            label="MORE"
            onClick={onOpenDockCmd ?? onToggleConsole}
            tone="neutral"
            size="sm"
          />
        </Stack>
        {quickOpen ? (
          <>
            <Box
              onPointerDown={dismissQuick}
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: 1390,
                backgroundColor: "transparent",
              }}
            />
            <Box
              onClick={dismissQuick}
              sx={{
                position: "fixed",
                top: 56,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1400,
                border: `${BORDER}px solid #1B1B1B`,
                backgroundColor: "var(--panel)",
                px: `${PAD}px`,
                py: `${GAP_SM}px`,
                display: "flex",
                gap: `${GAP_SM}px`,
              }}
            >
              <ObliqueKey
                label="MOVE"
                onClick={onMove}
                tone="blue"
                size="sm"
                startIcon={<KeyboardDoubleArrowRightIcon fontSize="small" />}
              />
              <ObliqueKey
                label="ATTACK"
                onClick={onAttack}
                tone="red"
                size="sm"
                startIcon={<ElectricBoltIcon fontSize="small" />}
              />
              <ObliqueKey
                label="END"
                onClick={onEndTurn}
                tone="black"
                accentColor={semanticColors.attack}
                size="sm"
              />
            </Box>
          </>
        ) : null}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "var(--surface2)",
        borderBottom: `${BORDER}px solid #1B1B1B`,
        px: `${PAD}px`,
        pt: `${PAD}px`,
        pb: `${PAD}px`,
        display: "flex",
        flexDirection: "column",
        gap: `${GAP_MD}px`,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "max-content minmax(0, 1fr) max-content",
          gap: `${GAP_MD}px`,
          alignItems: "center",
        }}
      >
        <Plate accentColor={playerStripe} sx={{ minWidth: 140, px: 2, py: 0.75 }}>
          <Typography variant="caption" fontWeight={700}>
            PLAYER: {player}
          </Typography>
        </Plate>
        {showStatusStrip ? (
          <PhaseStatusStrip
            vp={vp}
            showVp={showVp}
            turn={turn}
            phaseLabel={phaseLabel}
            compact
            maxPhaseWidth={isNarrow ? 100 : 140}
            wrap={false}
            framed={false}
          />
        ) : (
          <Box />
        )}
        {showConsoleToggle ? (
          <ObliqueKey
            label="CONSOLE"
            onClick={onToggleConsole}
            tone="neutral"
            size="sm"
          />
        ) : (
          <Box />
        )}
      </Box>

      {showCommandPanels ? (
        <Box
          sx={{
            border: `${BORDER}px solid #1B1B1B`,
            backgroundColor: "var(--panel)",
            px: `${PAD}px`,
            py: `${PAD}px`,
            display: "grid",
            gridTemplateColumns: isNarrow
              ? "minmax(0, 7fr) minmax(0, 5fr)"
              : "minmax(0, 4fr) minmax(0, 4fr) minmax(0, 4fr)",
            gap: `${GAP_MD}px`,
            alignItems: "stretch",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: `${isNarrow ? 12 : GAP_SM}px`,
              alignContent: "center",
              minWidth: 0,
            }}
          >
            {rowA.map((key) => (
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
                size={keySize}
              />
            ))}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignContent: "center",
              gap: `${GAP_SM}px`,
              minHeight: keySize === "sm" ? 36 : 40,
            }}
          >
            {rowB.length > 0 ? (
              rowB.map((key) => (
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
                  size={keySize}
                />
              ))
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" fontWeight={700}>
                  NO ACTIONS
                </Typography>
              </Box>
            )}
          </Box>
          {showPhaseControls && !isNarrow ? (
            <Box
              sx={{
                position: "relative",
                backgroundColor: "transparent",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: `${GAP_SM}px`,
                px: 0,
                minWidth: isTiny ? 200 : 240,
                alignItems: "center",
              }}
            >
              <ObliqueKey
                label={shortLabel("NEXT PHASE")}
                onClick={onNextPhase}
                disabled={isGameOver}
                tone="neutral"
                size={keySize}
                startIcon={
                  <PlayCircleOutlineIcon fontSize={keySize === "sm" ? "small" : "medium"} />
                }
              />
              <ObliqueKey
                label={shortLabel("END TURN")}
                onClick={onEndTurn}
                disabled={isGameOver}
                tone="black"
                active
                accentColor={semanticColors.attack}
                size={keySize}
                startIcon={
                  <StopCircleIcon fontSize={keySize === "sm" ? "small" : "medium"} />
                }
              />
            </Box>
          ) : !isNarrow ? (
            <Box />
          ) : null}
        </Box>
      ) : null}

      {showCommandPanels ? (
        <>
          <Box
            sx={{
              border: `${BORDER}px solid #1B1B1B`,
              backgroundColor: "var(--action-panel)",
              px: `${PAD}px`,
              py: `${GAP_SM}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: `${GAP_SM}px`,
            }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusCapsule
                label="MODE"
                value={mode}
                compact
                maxWidth={120}
                icon={null}
                tone={mode === "MOVE" ? "blue" : "red"}
              />
              <StatusCapsule
                label={secondaryCollapsed.label}
                value={capsuleValue(secondaryCollapsed.value)}
                compact
                maxWidth={160}
                icon={null}
              />
            </Stack>
            <ObliqueKey
              label={moreOpen ? "LESS" : "MORE V"}
              onClick={() => setMoreOpen((open) => !open)}
              tone="neutral"
              size="sm"
            />
          </Box>

          <Collapse
            in={moreOpen}
            timeout={reducedMotion ? 0 : DUR.standard}
            easing={EASE.stiff}
          >
            <Box
              sx={{
                border: `${BORDER}px solid #1B1B1B`,
                borderTop: 0,
                backgroundColor: "var(--panel)",
                px: `${PAD}px`,
                py: `${PAD}px`,
                display: "grid",
                gap: `${GAP_MD}px`,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {overflow.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: `${GAP_SM}px`,
                  }}
                >
                  {overflow.map((key) => (
                    <ObliqueKey
                      key={`overflow-${key.id}`}
                      label={key.label}
                      onClick={key.onClick}
                      disabled={key.disabled}
                      tone={key.tone}
                      size="sm"
                    />
                  ))}
                </Box>
              ) : null}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: `${GAP_SM}px`,
                }}
              >
                <StatusCapsule label="MODE" value={mode} compact maxWidth={140} icon={null} />
                <StatusCapsule label="STATUS" value={status} compact maxWidth={140} icon={null} />
                <StatusCapsule
                  label="SELECTED"
                  value={capsuleValue(selectionLabel)}
                  compact
                  maxWidth={160}
                  icon={null}
                />
                <StatusCapsule
                  label="PENDING"
                  value={capsuleValue(pendingAttackLabel)}
                  compact
                  maxWidth={160}
                  icon={null}
                />
                <StatusCapsule
                  label="LAST ROLL"
                  value={capsuleValue(lastRollLabel)}
                  compact
                  maxWidth={160}
                  icon={null}
                />
              </Box>
            </Box>
          </Collapse>
        </>
      ) : null}
    </Box>
  );
}
