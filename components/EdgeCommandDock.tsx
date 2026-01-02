"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ObliqueKey from "@/components/ui/ObliqueKey";
import ObliqueTabBar from "@/components/ui/ObliqueTabBar";
import { DUR, EASE, useReducedMotion } from "@/lib/ui/motion";

export type EdgeDockTab = "cmd" | "console";

type EdgeCommandDockProps = {
  open: boolean;
  pinned: boolean;
  tab: EdgeDockTab;
  onOpenChange: (open: boolean) => void;
  onPinnedChange: (pinned: boolean) => void;
  onTabChange: (tab: EdgeDockTab) => void;
  topOffset: number;
  cmdContent: ReactNode;
  consoleContent: ReactNode;
  onUserInteract?: () => void;
};

export default function EdgeCommandDock({
  open,
  pinned,
  tab,
  onOpenChange,
  onPinnedChange,
  onTabChange,
  topOffset,
  cmdContent,
  consoleContent,
  onUserInteract,
}: EdgeCommandDockProps) {
  const reducedMotion = useReducedMotion();
  const height = `calc(100dvh - ${Math.max(0, topOffset)}px)`;

  const handleOpen = (next: boolean) => {
    onUserInteract?.();
    onOpenChange(next);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        right: 0,
        top: `${topOffset}px`,
        height,
        zIndex: 1100,
        pointerEvents: "none",
      }}
    >
      {!open ? (
        <Box
          role="button"
          tabIndex={0}
          onClick={() => handleOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpen(true);
            }
          }}
          sx={{
            pointerEvents: "auto",
            width: 32,
            height: "100%",
            backgroundColor: "var(--panel)",
            borderLeft: "2px solid #1B1B1B",
            borderTop: "2px solid #1B1B1B",
            borderBottom: "2px solid #1B1B1B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <Box
            sx={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontWeight: 800,
              letterSpacing: "0.2em",
              fontSize: "0.65rem",
            }}
          >
            CMD
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          pointerEvents: open ? "auto" : "none",
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: "min(280px, 45vw)",
          backgroundColor: "var(--panel)",
          borderLeft: "2px solid #1B1B1B",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          opacity: open ? 1 : 0,
          transition: reducedMotion
            ? "none"
            : `transform ${DUR.standard}ms ${EASE.stiff}, opacity ${DUR.standard}ms ${EASE.stiff}`,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: "2px solid #1B1B1B",
            backgroundColor: "var(--action-panel)",
          }}
        >
          <ObliqueTabBar
            tabs={[
              { id: "cmd", label: "CMD" },
              { id: "console", label: "CONSOLE" },
            ]}
            activeId={tab}
            onChange={(id) => {
              onUserInteract?.();
              onTabChange(id as EdgeDockTab);
            }}
            size="sm"
          />
          <Stack direction="row" spacing={1}>
            <ObliqueKey
              label={pinned ? "UNPIN" : "PIN"}
              onClick={() => {
                onUserInteract?.();
                onPinnedChange(!pinned);
              }}
              tone="neutral"
              size="sm"
            />
            <ObliqueKey
              label="CLOSE"
              onClick={() => handleOpen(false)}
              tone="neutral"
              size="sm"
            />
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            px: 1.5,
            py: 1.5,
          }}
        >
          {tab === "cmd" ? cmdContent : consoleContent}
        </Box>
      </Box>
    </Box>
  );
}
