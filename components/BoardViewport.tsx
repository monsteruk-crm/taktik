import type { RefObject } from "react";
import { useRef, useState } from "react";
import Box from "@mui/material/Box";

type BoardViewportProps = {
  onClick?: (args: {
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
  }) => void;
  children: (args: {
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
  }) => React.ReactNode;
};

const CLICK_DRAG_THRESHOLD = 6;

export default function BoardViewport({ onClick, children }: BoardViewportProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    isPanningRef.current = true;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    startPointRef.current = { x: event.clientX, y: event.clientY };
    isDraggingRef.current = false;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPanningRef.current || !lastPointRef.current) {
      return;
    }
    const deltaX = event.clientX - lastPointRef.current.x;
    const deltaY = event.clientY - lastPointRef.current.y;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));

    if (startPointRef.current) {
      const movedX = event.clientX - startPointRef.current.x;
      const movedY = event.clientY - startPointRef.current.y;
      const movedDistance = Math.hypot(movedX, movedY);
      if (movedDistance > CLICK_DRAG_THRESHOLD) {
        isDraggingRef.current = true;
      }
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    isPanningRef.current = false;
    if (!isDraggingRef.current && startPointRef.current && onClick) {
      onClick({
        clientX: event.clientX,
        clientY: event.clientY,
        panX: pan.x,
        panY: pan.y,
        zoom,
        viewportRef,
      });
    }
    lastPointRef.current = null;
    startPointRef.current = null;
    isDraggingRef.current = false;
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    pointerIdRef.current = null;
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLDivElement>) {
    isPanningRef.current = false;
    lastPointRef.current = null;
    startPointRef.current = null;
    isDraggingRef.current = false;
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    pointerIdRef.current = null;
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.min(2, Math.max(0.5, zoom + direction * 0.1));
    setZoom(nextZoom);
  }

  return (
    <Box
      ref={viewportRef}
      sx={{
        width: "100%",
        height: "70vh",
        border: "1px solid #000",
        overflow: "hidden",
        touchAction: "none",
        position: "relative",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
    >
      <Box
        sx={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          inset: 0,
        }}
      >
        {children({ panX: pan.x, panY: pan.y, zoom, viewportRef })}
      </Box>
    </Box>
  );
}
