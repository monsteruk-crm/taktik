"use client";

import { useMemo, useState } from "react";
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

type KeyConfig = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "blue" | "red" | "yellow" | "black";
  active?: boolean;
};

type CommandHeaderProps = {
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
  canMove: boolean;
  canAttack: boolean;
  canRollDice: boolean;
  canResolveAttack: boolean;
  isGameOver: boolean;
  hasSelection: boolean;
  showConsoleToggle: boolean;
  onToggleConsole: () => void;
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
  canMove,
  canAttack,
  canRollDice,
  canResolveAttack,
  isGameOver,
  hasSelection,
  showConsoleToggle,
  onToggleConsole,
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
  const keySize = isNarrow ? "sm" : "md";
  const phaseLabel = isNarrow ? shortPhase(phase) : phase;
  const showVp = !isTiny;

  const shortLabel = (label: string) => (isTiny ? shortKey(label) : label);

  const rowA: KeyConfig[] = [
    {
      id: "move",
      label: shortLabel("MOVE"),
      onClick: onMove,
      disabled: !canMove,
      tone: "blue",
      active: mode === "MOVE",
    },
    {
      id: "attack",
      label: shortLabel("ATTACK"),
      onClick: onAttack,
      disabled: !canAttack,
      tone: "red",
      active: mode === "ATTACK",
    },
    {
      id: "end",
      label: shortLabel("END TURN"),
      onClick: onEndTurn,
      disabled: isGameOver,
      tone: "black",
    },
  ];

  const rowBBase: KeyConfig[] = [
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
    rowBBase.push({
      id: "clear",
      label: shortLabel("CLEAR SELECTION"),
      onClick: onClearSelection,
      tone: "neutral",
    });
  }

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

  return (
    <Box
      sx={{
        backgroundColor: "var(--surface)",
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
        <Plate accentColor="#1F4E79" sx={{ minWidth: 140, px: 2, py: 0.75 }}>
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
