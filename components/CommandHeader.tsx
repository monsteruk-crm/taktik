"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ObliqueKey from "@/components/ui/ObliqueKey";
import Plate from "@/components/ui/Plate";
import StatusCapsule from "@/components/ui/StatusCapsule";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";
import { shortKey, shortPhase, shortUnit } from "@/lib/ui/headerFormat";
import { BORDER, GAP_MD, GAP_SM, PAD } from "@/lib/ui/layoutTokens";
import { semanticColors } from "@/lib/ui/semanticColors";

type KeyConfig = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "blue" | "red" | "yellow" | "black";
  active?: boolean;
  accentColor?: string;
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

  const shortLabel = useCallback(
    (label: string) => (isTiny ? shortKey(label) : label),
    [isTiny]
  );

  const rowA: KeyConfig[] = [
    {
      id: "move",
      label: shortLabel("MOVE"),
      onClick: onMove,
      disabled: isGameOver,
      tone: "blue",
      active: mode === "MOVE",
    },
    {
      id: "attack",
      label: shortLabel("ATTACK"),
      onClick: onAttack,
      disabled: isGameOver,
      tone: "red",
      active: mode === "ATTACK",
    },
    {
      id: "end",
      label: shortLabel("END TURN"),
      onClick: onEndTurn,
      disabled: isGameOver,
      tone: "black",
      accentColor: semanticColors.attack,
      active: !isGameOver,
    },
  ];

  const rowBBase = useMemo(() => {
    const list: KeyConfig[] = [
      {
        id: "draw",
        label: shortLabel("DRAW CARD"),
        onClick: onDrawCard,
        disabled: !canDrawCard,
        tone: "neutral",
      },
      {
        id: "next",
        label: shortLabel("NEXT PHASE"),
        onClick: onNextPhase,
        disabled: isGameOver,
        tone: "neutral",
      },
      {
        id: "roll",
        label: shortLabel("ROLL DICE"),
        onClick: onRollDice,
        disabled: !canRollDice,
        tone: "yellow",
        active: canRollDice,
      },
      {
        id: "resolve",
        label: shortLabel("RESOLVE ATTACK"),
        onClick: onResolveAttack,
        disabled: !canResolveAttack,
        tone: "neutral",
      },
    ];
    if (hasSelection) {
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
    isGameOver,
    onClearSelection,
    onDrawCard,
    onNextPhase,
    onResolveAttack,
    onRollDice,
    shortLabel,
  ]);

  const { rowB, overflow } = useMemo(() => {
    const keys = [...rowBBase];
    const overflowed: KeyConfig[] = [];
    const maxRowB = isTiny ? 3 : 4;
    const removeById = (id: string) => {
      const index = keys.findIndex((item) => item.id === id);
      if (index >= 0) {
        overflowed.push(...keys.splice(index, 1));
      }
    };

    if (keys.length > maxRowB) {
      removeById("clear");
    }
    if (keys.length > maxRowB) {
      removeById("resolve");
    }
    if (keys.length > maxRowB && !canDrawCard) {
      removeById("draw");
    }
    if (keys.length > maxRowB && !canRollDice) {
      removeById("roll");
    }
    while (keys.length > maxRowB) {
      overflowed.push(keys.pop() as KeyConfig);
    }

    return { rowB: keys, overflow: overflowed };
  }, [canDrawCard, canRollDice, isTiny, rowBBase]);

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
              <ObliqueKey label="MOVE" onClick={onMove} tone="blue" size="sm" />
              <ObliqueKey label="ATTACK" onClick={onAttack} tone="red" size="sm" />
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: `${GAP_SM}px`,
            minWidth: 0,
            flexWrap: "nowrap",
            overflow: "hidden",
          }}
        >
          {showVp ? (
            <StatusCapsule label="VP" value={vp} compact icon={null} />
          ) : null}
          <StatusCapsule label="TURN" value={turn} compact icon={null} />
          <StatusCapsule
            label="PHASE"
            value={phaseLabel}
            compact
            maxWidth={isNarrow ? 100 : 140}
            icon={null}
          />
        </Box>
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

      <Box
        sx={{
          border: `${BORDER}px solid #1B1B1B`,
          backgroundColor: "var(--panel)",
          px: `${PAD}px`,
          py: `${PAD}px`,
          display: "grid",
          gap: `${GAP_SM}px`,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: `${GAP_SM}px`,
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
              size={keySize}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${isTiny ? 3 : 4}, minmax(0, 1fr))`,
            gap: `${GAP_SM}px`,
          }}
        >
          {rowB.map((key) => (
            <ObliqueKey
              key={key.id}
              label={key.label}
              onClick={key.onClick}
              disabled={key.disabled}
              tone={key.tone}
              active={key.active}
              accentColor={key.accentColor}
              size={keySize}
            />
          ))}
        </Box>
      </Box>

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

      <Collapse in={moreOpen} timeout={reducedMotion ? 0 : DUR.standard} easing={EASE.stiff}>
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
    </Box>
  );
}
