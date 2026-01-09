"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import type { GameState } from "@/lib/engine/gameState";
import { gridToScreen } from "@/lib/ui/iso";
import { attackFxConfig } from "@/lib/settings";
import { DUR } from "@/lib/ui/motion";
import { semanticColors } from "@/lib/ui/semanticColors";

type BoardFxLayerProps = {
  state: GameState;
  originX: number;
  originY: number;
  tileW: number;
  tileH: number;
  reducedMotion: boolean;
};

type Anchor = { x: number; y: number };

type AttackSnapshot = {
  attackerId: string;
  targetId: string;
  attackerAnchor: Anchor;
  targetAnchor: Anchor;
  outcome?: "HIT" | "MISS";
};

type FxItem =
  | {
      id: string;
      kind: "tracer";
      start: Anchor;
      end: Anchor;
      duration: number;
    }
  | {
      id: string;
      kind: "muzzle";
      anchor: Anchor;
      duration: number;
    }
  | {
      id: string;
      kind: "impact";
      anchor: Anchor;
      duration: number;
      outcome: "HIT" | "MISS";
    }
  | {
      id: string;
      kind: "resolve";
      anchor: Anchor;
      duration: number;
      outcome: "HIT" | "MISS";
    }
  | {
      id: string;
      kind: "effectPulse";
      tile: { left: number; top: number };
      duration: number;
    };

const FX_Z = {
  aim: 900,
  pulse: 940,
  tracer: 950,
  muzzle: 960,
  impact: 970,
  resolve: 980,
} as const;

function lineGeometry(start: Anchor, end: Anchor) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return {
    length: Math.max(0, Math.hypot(dx, dy)),
    angle: Math.atan2(dy, dx),
  };
}

export default function BoardFxLayer({
  state,
  originX,
  originY,
  tileW,
  tileH,
  reducedMotion,
}: BoardFxLayerProps) {
  const [fxItems, setFxItems] = useState<FxItem[]>([]);
  const fxIdRef = useRef(0);
  const timeoutsRef = useRef<Map<string, number>>(new Map());
  const attackSnapshotRef = useRef<AttackSnapshot | null>(null);
  const pendingAttackRef = useRef(state.pendingAttack);
  const lastRollRef = useRef(state.lastRoll);
  const effectsInitializedRef = useRef(false);
  const prevEffectIdsRef = useRef<Set<string>>(new Set());

  const unitById = useMemo(() => {
    return new Map(state.units.map((unit) => [unit.id, unit]));
  }, [state.units]);
  const lineOffset = useMemo(
    () => ({
      x: attackFxConfig.lineOffsetX,
      y: attackFxConfig.lineOffsetY,
    }),
    []
  );
  const targetScaleY = attackFxConfig.targetScaleY;

  const sizes = useMemo(() => {
    return {
      aimThickness: Math.max(3, Math.round(tileW * 0.03)),
      tracerThickness: Math.max(2, Math.round(tileW * 0.02)),
      muzzleSize: Math.max(8, Math.round(tileW * 0.1)),
      impactSize: Math.max(16, Math.round(tileW * 0.22)),
      resolveSize: Math.max(18, Math.round(tileW * 0.24)),
      missWidth: Math.max(34, Math.round(tileW * 0.32)),
      missHeight: Math.max(14, Math.round(tileW * 0.12)),
      targetSize: tileW,
    };
  }, [tileW]);

  const spawnFx = (item: FxItem) => {
    setFxItems((current) => [...current, item]);
    const timeoutId = window.setTimeout(() => {
      setFxItems((current) => current.filter((fx) => fx.id !== item.id));
      timeoutsRef.current.delete(item.id);
    }, item.duration);
    timeoutsRef.current.set(item.id, timeoutId);
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const prevPending = pendingAttackRef.current;
    const prevRoll = lastRollRef.current;
    const nextPending = state.pendingAttack;
    const nextRoll = state.lastRoll;

    if (
      nextPending &&
      (!prevPending ||
        prevPending.attackerId !== nextPending.attackerId ||
        prevPending.targetId !== nextPending.targetId)
    ) {
      const attacker = unitById.get(nextPending.attackerId);
      const target = unitById.get(nextPending.targetId);
      if (attacker && target) {
        const attackerScreen = gridToScreen(attacker.position);
        const targetScreen = gridToScreen(target.position);
        attackSnapshotRef.current = {
          attackerId: attacker.id,
          targetId: target.id,
          attackerAnchor: {
            x: originX + attackerScreen.sx,
            y: originY + attackerScreen.sy,
          },
          targetAnchor: {
            x: originX + targetScreen.sx,
            y: originY + targetScreen.sy,
          },
        };
      }
    }

    if (!prevRoll && nextRoll && attackSnapshotRef.current) {
      attackSnapshotRef.current.outcome = nextRoll.outcome;
      const snapshot = attackSnapshotRef.current;
      if (reducedMotion) {
        spawnFx({
          id: `impact-${fxIdRef.current += 1}`,
          kind: "impact",
          anchor: snapshot.targetAnchor,
          duration: DUR.fast,
          outcome: nextRoll.outcome,
        });
      } else {
        spawnFx({
          id: `tracer-${fxIdRef.current += 1}`,
          kind: "tracer",
          start: snapshot.attackerAnchor,
          end: snapshot.targetAnchor,
          duration: DUR.fast,
        });
        spawnFx({
          id: `muzzle-${fxIdRef.current += 1}`,
          kind: "muzzle",
          anchor: snapshot.attackerAnchor,
          duration: DUR.micro,
        });
        spawnFx({
          id: `impact-${fxIdRef.current += 1}`,
          kind: "impact",
          anchor: snapshot.targetAnchor,
          duration: DUR.standard,
          outcome: nextRoll.outcome,
        });
      }
    }

    if (prevPending && !nextPending && attackSnapshotRef.current) {
      const outcome =
        attackSnapshotRef.current.outcome ?? prevRoll?.outcome ?? "MISS";
      spawnFx({
        id: `resolve-${fxIdRef.current += 1}`,
        kind: "resolve",
        anchor: attackSnapshotRef.current.targetAnchor,
        duration: DUR.standard,
        outcome,
      });
      attackSnapshotRef.current = null;
    }

    pendingAttackRef.current = nextPending;
    lastRollRef.current = nextRoll;
  }, [originX, originY, reducedMotion, state.lastRoll, state.pendingAttack, unitById]);

  useEffect(() => {
    if (!effectsInitializedRef.current) {
      effectsInitializedRef.current = true;
      prevEffectIdsRef.current = new Set(state.activeEffects.map((effect) => effect.id));
      return;
    }
    const prevIds = prevEffectIdsRef.current;
    const nextIds = new Set(state.activeEffects.map((effect) => effect.id));
    const newEffects = state.activeEffects.filter((effect) => !prevIds.has(effect.id));
    prevEffectIdsRef.current = nextIds;

    if (newEffects.length === 0) {
      return;
    }

    newEffects.forEach((effect) => {
      if (!effect.targetUnitIds) {
        return;
      }
      effect.targetUnitIds.forEach((unitId) => {
        const unit = unitById.get(unitId);
        if (!unit) {
          return;
        }
        const { sx, sy } = gridToScreen(unit.position);
        spawnFx({
          id: `pulse-${fxIdRef.current += 1}`,
          kind: "effectPulse",
          tile: {
            left: originX + sx - tileW / 2,
            top: originY + sy - tileH / 2,
          },
          duration: DUR.standard,
        });
      });
    });
  }, [originX, originY, state.activeEffects, tileH, tileW, unitById]);

  const aimSnapshot = useMemo(() => {
    if (!state.pendingAttack) {
      return null;
    }
    const attacker = unitById.get(state.pendingAttack.attackerId);
    const target = unitById.get(state.pendingAttack.targetId);
    if (attacker && target) {
      const attackerScreen = gridToScreen(attacker.position);
      const targetScreen = gridToScreen(target.position);
      return {
        attackerAnchor: {
          x: originX + attackerScreen.sx,
          y: originY + attackerScreen.sy,
        },
        targetAnchor: {
          x: originX + targetScreen.sx,
          y: originY + targetScreen.sy,
        },
      };
    }
    if (attackSnapshotRef.current) {
      return {
        attackerAnchor: attackSnapshotRef.current.attackerAnchor,
        targetAnchor: attackSnapshotRef.current.targetAnchor,
      };
    }
    return null;
  }, [originX, originY, state.pendingAttack, unitById]);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {aimSnapshot && (
        <>
          {(() => {
            const start = {
              x: aimSnapshot.attackerAnchor.x + lineOffset.x,
              y: aimSnapshot.attackerAnchor.y + lineOffset.y,
            };
            const end = {
              x: aimSnapshot.targetAnchor.x + lineOffset.x,
              y: aimSnapshot.targetAnchor.y + lineOffset.y,
            };
            const { length, angle } = lineGeometry(start, end);
            if (!length) {
              return null;
            }
            return (
              <Box
                sx={{
                  "--fx-rot": `${angle}rad`,
                  position: "absolute",
                  left: start.x,
                  top: start.y - sizes.aimThickness / 2,
                  width: length,
                  height: sizes.aimThickness,
                  backgroundColor: semanticColors.attack,
                  opacity: 0.8,
                  transformOrigin: "0 50%",
                  transform: "rotate(var(--fx-rot))",
                  zIndex: FX_Z.aim,
                }}
              />
            );
          })()}
          <Box
            sx={{
              position: "absolute",
              left: aimSnapshot.targetAnchor.x - sizes.targetSize / 2,
              top: aimSnapshot.targetAnchor.y - tileH / 2,
              width: sizes.targetSize,
              height: sizes.targetSize * targetScaleY,
              zIndex: FX_Z.aim,
            }}
          >
            <Box
              component="svg"
              width={sizes.targetSize}
              height={sizes.targetSize * targetScaleY}
              viewBox={`0 0 ${sizes.targetSize} ${sizes.targetSize * targetScaleY}`}
              sx={{ display: "block" }}
            >
              <polygon
                points={`${sizes.targetSize / 2},0 ${sizes.targetSize},${(sizes.targetSize * targetScaleY) / 2} ${sizes.targetSize / 2},${sizes.targetSize * targetScaleY} 0,${(sizes.targetSize * targetScaleY) / 2}`}
                fill="none"
                stroke={semanticColors.attack}
                strokeWidth={2}
              />
            </Box>
          </Box>
        </>
      )}

      {fxItems.map((fx) => {
        if (fx.kind === "tracer") {
          const start = {
            x: fx.start.x + lineOffset.x,
            y: fx.start.y + lineOffset.y,
          };
          const end = {
            x: fx.end.x + lineOffset.x,
            y: fx.end.y + lineOffset.y,
          };
          const { length, angle } = lineGeometry(start, end);
          if (!length) {
            return null;
          }
          return (
            <Box
              key={fx.id}
              sx={{
                "--fx-rot": `${angle}rad`,
                position: "absolute",
                left: start.x,
                top: start.y - sizes.tracerThickness / 2,
                width: length,
                height: sizes.tracerThickness,
                backgroundColor: semanticColors.attack,
                transformOrigin: "0 50%",
                transform: "rotate(var(--fx-rot)) scaleX(1)",
                animation: reducedMotion
                  ? "none"
                  : `fxTracer ${fx.duration}ms linear`,
                zIndex: FX_Z.tracer,
                "@keyframes fxTracer": {
                  "0%": {
                    transform: "rotate(var(--fx-rot)) scaleX(0)",
                  },
                  "100%": {
                    transform: "rotate(var(--fx-rot)) scaleX(1)",
                  },
                },
              }}
            />
          );
        }
        if (fx.kind === "muzzle") {
          return (
            <Box
              key={fx.id}
              sx={{
                position: "absolute",
                left: fx.anchor.x,
                top: fx.anchor.y,
                width: sizes.muzzleSize,
                height: sizes.muzzleSize,
                backgroundColor: semanticColors.attack,
                transform: "translate(-50%, -50%) rotate(45deg)",
                animation: `fxFlash ${fx.duration}ms linear`,
                zIndex: FX_Z.muzzle,
                "@keyframes fxFlash": {
                  "0%": { opacity: 0 },
                  "40%": { opacity: 1 },
                  "100%": { opacity: 0 },
                },
              }}
            />
          );
        }
        if (fx.kind === "impact") {
          const impactColor =
            fx.outcome === "HIT" ? semanticColors.attack : semanticColors.ink;
          return (
            <Box
              key={fx.id}
              sx={{
                position: "absolute",
                left: fx.anchor.x,
                top: fx.anchor.y,
                width: sizes.impactSize,
                height: sizes.impactSize,
                border: `2px solid ${impactColor}`,
                transform: "translate(-50%, -50%) rotate(45deg)",
                animation: `fxImpact ${fx.duration}ms linear`,
                zIndex: FX_Z.impact,
                "@keyframes fxImpact": {
                  "0%": { opacity: 0 },
                  "30%": { opacity: 1 },
                  "100%": { opacity: 0 },
                },
              }}
            />
          );
        }
        if (fx.kind === "resolve") {
          if (fx.outcome === "HIT") {
            return (
              <Box
                key={fx.id}
                sx={{
                  position: "absolute",
                  left: fx.anchor.x,
                  top: fx.anchor.y,
                  width: sizes.resolveSize,
                  height: sizes.resolveSize,
                  transform: "translate(-50%, -50%)",
                  zIndex: FX_Z.resolve,
                  animation: `fxResolve ${fx.duration}ms linear`,
                  "@keyframes fxResolve": {
                    "0%": { opacity: 0 },
                    "30%": { opacity: 1 },
                    "100%": { opacity: 0 },
                  },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: semanticColors.attack,
                    height: 3,
                    top: "50%",
                    transform: "translateY(-50%) rotate(45deg)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: semanticColors.attack,
                    height: 3,
                    top: "50%",
                    transform: "translateY(-50%) rotate(-45deg)",
                  }}
                />
              </Box>
            );
          }
          return (
            <Box
              key={fx.id}
              sx={{
                position: "absolute",
                left: fx.anchor.x,
                top: fx.anchor.y,
                width: sizes.missWidth,
                height: sizes.missHeight,
                border: `2px solid ${semanticColors.ink}`,
                backgroundColor: semanticColors.panel,
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: semanticColors.ink,
                zIndex: FX_Z.resolve,
                animation: `fxResolve ${fx.duration}ms linear`,
                "@keyframes fxResolve": {
                  "0%": { opacity: 0 },
                  "30%": { opacity: 1 },
                  "100%": { opacity: 0 },
                },
              }}
            >
              MISS
            </Box>
          );
        }
        if (fx.kind === "effectPulse") {
          return (
            <Box
              key={fx.id}
              component="img"
              draggable={false}
              alt="Effect pulse"
              src="/assets/tiles/highlight_target_confirm.png"
              onDragStart={(event) => {
                event.preventDefault();
              }}
              sx={{
                position: "absolute",
                left: fx.tile.left,
                top: fx.tile.top,
                width: tileW,
                height: tileH,
                opacity: 0,
                animation: reducedMotion
                  ? `fxPulseFade ${fx.duration}ms linear`
                  : `fxPulse ${fx.duration}ms linear`,
                zIndex: FX_Z.pulse,
                "@keyframes fxPulse": {
                  "0%": { opacity: 1, transform: "scale(0.85)" },
                  "100%": { opacity: 0, transform: "scale(1.05)" },
                },
                "@keyframes fxPulseFade": {
                  "0%": { opacity: 1 },
                  "100%": { opacity: 0 },
                },
              }}
            />
          );
        }
        return null;
      })}
    </Box>
  );
}
