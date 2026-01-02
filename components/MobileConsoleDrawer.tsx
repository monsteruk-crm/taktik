"use client";

import type {ReactNode} from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ObliqueKey from "@/components/ui/ObliqueKey";
import {DUR, EASE, useReducedMotion} from "@/lib/ui/motion";

type DrawerSize = "peek" | "half" | "full";

type MobileConsoleDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    header: ReactNode;
    tabs: ReactNode;
    body: ReactNode;
    initialSize?: DrawerSize;
    devNotice?: ReactNode;
    topOffset?: number;
};

const SIZE_CONFIG: Record<DrawerSize, { dvh: number; min: number; max?: number }> = {
    peek: {dvh: 22, min: 160},
    half: {dvh: 55, min: 360},
    full: {dvh: 82, min: 360, max: 720},
};

function getSizeHeight(viewportHeight: number, size: DrawerSize, maxHeight: number) {
    const config = SIZE_CONFIG[size];
    const baseHeight = (viewportHeight * config.dvh) / 100;
    let clamped = Math.max(config.min, baseHeight);
    if (config.max) {
        clamped = Math.min(clamped, config.max);
    }
    if (maxHeight) {
        clamped = Math.min(clamped, maxHeight);
    }
    return Math.max(0, Math.floor(clamped));
}

export default function MobileConsoleDrawer({
                                                open,
                                                onOpenChange,
                                                header,
                                                tabs,
                                                body,
                                                initialSize = "half",
                                                devNotice,
                                                topOffset = 0,
                                            }: MobileConsoleDrawerProps) {
    const [size, setSize] = useState<DrawerSize>(initialSize);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [dragHeight, setDragHeight] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ startY: number; startHeight: number } | null>(null);
    const wasDraggedRef = useRef(false);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (!open) {
            return;
        }
        setSize("half");
    }, [open]);

    useEffect(() => {
        if (open) {
            return;
        }
        setDragHeight(null);
        setIsDragging(false);
        dragStartRef.current = null;
        wasDraggedRef.current = false;
    }, [open]);

    useEffect(() => {
        const update = () => setViewportHeight(window.innerHeight || 0);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const maxHeight = useMemo(() => {
        if (!viewportHeight) {
            return 0;
        }
        if (!topOffset) {
            return viewportHeight;
        }
        return Math.max(0, viewportHeight - topOffset - 8);
    }, [topOffset, viewportHeight]);

    const sizeHeights = useMemo(() => {
        if (!viewportHeight) {
            return {peek: 0, half: 0, full: 0};
        }
        return {
            peek: getSizeHeight(viewportHeight, "peek", maxHeight),
            half: getSizeHeight(viewportHeight, "half", maxHeight),
            full: getSizeHeight(viewportHeight, "full", maxHeight),
        };
    }, [maxHeight, viewportHeight]);

    const panelHeight = useMemo(() => {
        if (!viewportHeight) {
            return 0;
        }
        return getSizeHeight(viewportHeight, size, maxHeight);
    }, [maxHeight, size, viewportHeight]);

    const cycleSize = () => {
        setSize((current) =>
            current === "peek" ? "half" : current === "half" ? "full" : "half"
        );
    };

    useEffect(() => {
        if (!isDragging) {
            return;
        }
        const handleMove = (event: PointerEvent) => {
            if (!dragStartRef.current) {
                return;
            }
            const delta = dragStartRef.current.startY - event.clientY;
            if (Math.abs(delta) > 4) {
                wasDraggedRef.current = true;
            }
            const next = dragStartRef.current.startHeight + delta;
            const minHeight = sizeHeights.peek;
            const maxAllowed = sizeHeights.full || maxHeight || next;
            const clamped = Math.max(minHeight, Math.min(next, maxAllowed));
            setDragHeight(clamped);
        };
        const handleUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;
            const finalHeight = dragHeight ?? panelHeight;
            const targets: Array<[DrawerSize, number]> = [
                ["peek", sizeHeights.peek],
                ["half", sizeHeights.half],
                ["full", sizeHeights.full],
            ];
            const closest = targets.reduce(
                (best, current) =>
                    Math.abs(current[1] - finalHeight) < Math.abs(best[1] - finalHeight)
                        ? current
                        : best,
                targets[0]
            );
            setSize(closest[0]);
            setDragHeight(null);
        };
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleUp);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            window.removeEventListener("pointercancel", handleUp);
        };
    }, [dragHeight, isDragging, maxHeight, panelHeight, sizeHeights]);

    if (!open) {
        return null;
    }

    return (
        <Box
            sx={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1200,
                pointerEvents: "none",
            }}
        >
            <Box
                sx={{
                    pointerEvents: "auto",
                    height: (dragHeight ?? panelHeight) ? `${dragHeight ?? panelHeight}px` : "auto",
                    backgroundColor: "var(--panel)",
                    borderTop: "2px solid #1B1B1B",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    transition: reducedMotion || isDragging
                        ? "none"
                        : `height ${DUR.standard}ms ${EASE.stiff}`,
                }}
            >
                <Box
                    id="drawer-drag-handle"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        if (wasDraggedRef.current) {
                            wasDraggedRef.current = false;
                            return;
                        }
                        cycleSize();
                    }}
                    onPointerDown={(event) => {
                        if (!panelHeight) {
                            return;
                        }
                        event.preventDefault();
                        wasDraggedRef.current = false;
                        dragStartRef.current = {startY: event.clientY, startHeight: panelHeight};
                        setDragHeight(panelHeight);
                        setIsDragging(true);
                        event.currentTarget.setPointerCapture?.(event.pointerId);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            cycleSize();
                        }
                    }}
                    sx={{
                        height: 44,
                        borderBottom: "2px solid #1B1B1B",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.35,
                        cursor: isDragging ? "grabbing" : "grab",
                        userSelect: "none",
                        touchAction: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 6,
                            bgcolor: "#1B1B1B",
                        }}
                    />
                    {size === "peek" ? (
                        <Typography variant="caption" fontWeight={700}>
                            TAP TO EXPAND
                        </Typography>
                    ) : null}
                </Box>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                        px: 2,
                        py: 1,
                        borderBottom: "2px solid #1B1B1B",
                        minHeight: 0,
                    }}
                >
                    <Box sx={{flex: 1, minWidth: 0}}>{header}</Box>
                    <ObliqueKey label="X" onClick={() => onOpenChange(false)} tone="neutral" size="sm"/>
                </Stack>
                <Box sx={{px: 2, pt: 1}}>{tabs}</Box>
                {devNotice ? <Box sx={{px: 2, pt: 1}}>{devNotice}</Box> : null}
                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "auto",
                        overflowX: "hidden",
                        px: 2,
                        pb: 2,
                    }}
                >
                    {body}
                </Box>
            </Box>
        </Box>
    );
}
