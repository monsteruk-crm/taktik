import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";

type BoardViewportProps = {
  /** Height of the viewport container. Defaults to filling the parent. */
  height?: string | number;
  /** Optional style override for the outer viewport container. */
  sx?: SxProps<Theme>;
  /** Optional initial pan, or a function that computes it from viewport size. */
  initialPan?: { x: number; y: number } | ((args: { width: number; height: number }) => { x: number; y: number });
  /** Optional initial zoom level. */
  initialZoom?: number;
  onClick?: (args: {
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
  }) => void;
  onHover?: (args: {
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
    isPanning: boolean;
  }) => void;
  onHoverEnd?: () => void;
  children: (args: {
    panX: number;
    panY: number;
    zoom: number;
    viewportRef: RefObject<HTMLDivElement | null>;
  }) => React.ReactNode;
};

const CLICK_DRAG_THRESHOLD = 6;

export default function BoardViewport({
  onClick,
  onHover,
  onHoverEnd,
  children,
  height = "100%",
  sx,
  initialPan,
  initialZoom = 1,
}: BoardViewportProps) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isPanningRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const initialPanRef = useRef(initialPan);
  const initialZoomRef = useRef(initialZoom);

  function clampZoom(nextZoom: number) {
    return Math.min(3, Math.max(0.6, nextZoom));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    isPanningRef.current = true;
    setIsPanning(true);
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    startPointRef.current = { x: event.clientX, y: event.clientY };
    isDraggingRef.current = false;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      pinchRef.current = { distance, zoom: zoomRef.current };
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (onHover) {
      onHover({
        clientX: event.clientX,
        clientY: event.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        zoom: zoomRef.current,
        viewportRef,
        isPanning: isPanningRef.current,
      });
    }
    if (!isPanningRef.current || !lastPointRef.current) {
      return;
    }
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const scale = distance / pinchRef.current.distance;
      const nextZoom = clampZoom(pinchRef.current.zoom * scale);
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const worldX = (midpoint.x - panRef.current.x) / zoomRef.current;
      const worldY = (midpoint.y - panRef.current.y) / zoomRef.current;
      const nextPan = {
        x: midpoint.x - worldX * nextZoom,
        y: midpoint.y - worldY * nextZoom,
      };
      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      setZoom(nextZoom);
      setPan(nextPan);
      return;
    }
    const deltaX = event.clientX - lastPointRef.current.x;
    const deltaY = event.clientY - lastPointRef.current.y;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    setPan((current) => {
      const next = { x: current.x + deltaX, y: current.y + deltaY };
      panRef.current = next;
      return next;
    });

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
    setIsPanning(false);
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
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
    setIsPanning(false);
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    lastPointRef.current = null;
    startPointRef.current = null;
    isDraggingRef.current = false;
    if (pointerIdRef.current !== null) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    pointerIdRef.current = null;
  }

  function handlePointerLeave(event: React.PointerEvent<HTMLDivElement>) {
    handlePointerCancel(event);
    if (onHoverEnd) {
      onHoverEnd();
    }
  }

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }
    const nodeEl = node;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = nodeEl.getBoundingClientRect();
      const clientX = event.clientX - rect.left;
      const clientY = event.clientY - rect.top;
      const currentZoom = zoomRef.current;
      const zoomFactor = Math.exp(-event.deltaY * 0.001);
      const nextZoom = Math.min(2, Math.max(0.5, currentZoom * zoomFactor));
      const worldX = (clientX - panRef.current.x) / currentZoom;
      const worldY = (clientY - panRef.current.y) / currentZoom;
      const nextPan = {
        x: clientX - worldX * nextZoom,
        y: clientY - worldY * nextZoom,
      };
      panRef.current = nextPan;
      zoomRef.current = nextZoom;
      setPan(nextPan);
      setZoom(nextZoom);
    }
    nodeEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      nodeEl.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const setViewportNode = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      if (!node || hasInitializedRef.current) {
        return;
      }
      const rect = node.getBoundingClientRect();
      const nextZoom = initialZoom;
      const nextPan =
        typeof initialPan === "function"
          ? initialPan({ width: rect.width, height: rect.height })
          : initialPan ?? { x: 0, y: 0 };
      hasInitializedRef.current = true;
      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      setZoom(nextZoom);
      setPan(nextPan);
    },
    [initialPan, initialZoom]
  );

  useEffect(() => {
    initialPanRef.current = initialPan;
  }, [initialPan]);

  useEffect(() => {
    initialZoomRef.current = initialZoom;
  }, [initialZoom]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }
    const recenter = () => {
      const rect = node.getBoundingClientRect();
      const nextZoom = initialZoomRef.current;
      const nextPanSource = initialPanRef.current;
      const nextPan =
        typeof nextPanSource === "function"
          ? nextPanSource({ width: rect.width, height: rect.height })
          : nextPanSource ?? { x: 0, y: 0 };
      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      setZoom(nextZoom);
      setPan(nextPan);
    };
    const observer = new ResizeObserver(() => recenter());
    observer.observe(node);
    window.addEventListener("orientationchange", recenter);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", recenter);
    };
  }, []);

  return (
    <Box
      ref={setViewportNode}
      sx={{
        width: "100%",
        height,
        border: "2px solid #1B1B1B",
        overflow: "hidden",
        touchAction: "none",
        position: "relative",
        cursor: isPanning ? "grabbing" : "grab",
        ...sx,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
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
