import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CardDefinition } from "@/lib/engine/gameState";
import CardArt from "@/lib/ui/CardArt";
import Plate from "@/components/ui/Plate";
import BandHeader from "@/components/ui/BandHeader";
import { EASE } from "@/lib/ui/motion";
import { semanticColors } from "@/lib/ui/semanticColors";
import { cardDrawOverlayTiming } from "@/lib/settings";

type CardDrawOverlayProps = {
  card: CardDefinition;
  reducedMotion: boolean;
  onComplete: () => void;
};

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const CARD_ASPECT = 2 / 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function computeStartRect(): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxWidth = clamp(vw * 0.72, 240, 640);
  const maxHeight = clamp(vh * 0.78, 320, 860);
  let width = maxWidth;
  let height = width / CARD_ASPECT;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * CARD_ASPECT;
  }
  const left = Math.max(16, (vw - width) / 2);
  const top = Math.max(16, (vh - height) / 2);
  return { left, top, width, height };
}

function rectFromElement(element: HTMLElement | null): Rect | null {
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return null;
  }
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function findPendingCardSlot(cardId: string): Rect | null {
  const slots = Array.from(
    document.querySelectorAll<HTMLElement>("[data-pending-card-slot=\"true\"]")
  );
  const matching = slots.filter((slot) => {
    if (!slot.dataset.cardId) {
      return true;
    }
    return slot.dataset.cardId === cardId;
  });
  for (const slot of matching) {
    const rect = rectFromElement(slot);
    if (rect) {
      return rect;
    }
  }
  return null;
}

export default function CardDrawOverlay({
  card,
  reducedMotion,
  onComplete,
}: CardDrawOverlayProps) {
  const [phase, setPhase] = useState<"reveal" | "travel">("reveal");
  const [startRect, setStartRect] = useState<Rect | null>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const timersRef = useRef<number[]>([]);

  const accentColor = useMemo(() => {
    if (card.kind === "bonus") {
      return semanticColors.move;
    }
    if (card.kind === "malus") {
      return semanticColors.attack;
    }
    return semanticColors.dice;
  }, [card.kind]);

  useEffect(() => {
    setStartRect(computeStartRect());
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!startRect) {
      return;
    }
    if (reducedMotion) {
      const timer = window.setTimeout(
        onComplete,
        cardDrawOverlayTiming.holdMs + cardDrawOverlayTiming.exitBufferMs
      );
      timersRef.current.push(timer);
      return;
    }
    const travelTimer = window.setTimeout(() => {
      setTargetRect(findPendingCardSlot(card.id));
      setPhase("travel");
    }, cardDrawOverlayTiming.holdMs);
    const exitTimer = window.setTimeout(
      onComplete,
      cardDrawOverlayTiming.holdMs +
        cardDrawOverlayTiming.tweenMs +
        cardDrawOverlayTiming.exitBufferMs
    );
    timersRef.current.push(travelTimer, exitTimer);
  }, [card.id, onComplete, reducedMotion, startRect]);

  if (!startRect) {
    return null;
  }

  const travelTransform =
    phase === "travel" && targetRect && !reducedMotion
      ? (() => {
          const startCenterX = startRect.left + startRect.width / 2;
          const startCenterY = startRect.top + startRect.height / 2;
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const targetCenterY = targetRect.top + targetRect.height / 2;
          const scaleX = targetRect.width / startRect.width;
          const scaleY = targetRect.height / startRect.height;
          const scale = Math.min(scaleX, scaleY);
          const translateX = targetCenterX - startCenterX;
          const translateY = targetCenterY - startCenterY;
          return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        })()
      : "none";
  return (
    <>
      {!reducedMotion ? (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 8999,
            pointerEvents: "none",
            animation: "cardDrawFlash 300ms linear 1",
            "@keyframes cardDrawFlash": {
              "0%": { backgroundColor: semanticColors.ink },
              "33%": { backgroundColor: "#FFFFFF" },
              "66%": { backgroundColor: semanticColors.attack },
              "100%": { backgroundColor: "transparent" },
            },
          }}
        />
      ) : null}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9000,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: { xs: 16, sm: 24 },
            top: { xs: 16, sm: 24 },
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box sx={{ width: { xs: "calc(100vw - 32px)", sm: 420, md: 520 } }}>
            <BandHeader titleLeft="CARD DRAWN" accentColor={accentColor} />
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
          >
            <Plate accentColor={accentColor}>
              <Typography variant="caption" fontWeight={800}>
                {card.kind.toUpperCase()}
              </Typography>
            </Plate>
            <Plate>
              <Typography variant="caption" fontWeight={800}>
                {card.name.toUpperCase()}
              </Typography>
            </Plate>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          position: "fixed",
          left: startRect.left,
          top: startRect.top,
          width: startRect.width,
          height: startRect.height,
          zIndex: 9001,
          pointerEvents: "none",
          transformOrigin: "center center",
          transform: travelTransform,
          transition: reducedMotion
            ? "none"
            : `transform ${cardDrawOverlayTiming.tweenMs}ms ${EASE.snap}`,
        }}
      >
        <CardArt
          card={card}
          label={`Art for ${card.name}`}
          maxWidth="100%"
          height="100%"
          fit="contain"
          bordered={false}
        />
      </Box>
    </>
  );
}
