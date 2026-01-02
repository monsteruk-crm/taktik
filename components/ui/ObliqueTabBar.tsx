import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { DUR, EASE } from "@/lib/ui/motion";
import { semanticColors, textOn } from "@/lib/ui/semanticColors";

type ObliqueTab = {
  id: string;
  label: string;
  hidden?: boolean;
};

type ObliqueTabBarProps = {
  tabs: ObliqueTab[];
  activeId: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  rightContent?: ReactNode;
};

const SHAPE_LEFT = "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)";
const SHAPE_MID = "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)";
const SHAPE_RIGHT = "polygon(12px 0, 100% 0, 100% 100%, 0 100%)";

const TAB_STRIPE: Record<string, string> = {
  cards: semanticColors.dice,
  tactics: semanticColors.move,
  log: semanticColors.neutralStripe,
};

export default function ObliqueTabBar({
  tabs,
  activeId,
  onChange,
  size = "md",
  rightContent,
}: ObliqueTabBarProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const visibleTabs = useMemo(() => tabs.filter((tab) => !tab.hidden), [tabs]);
  const activeIndex = Math.max(
    0,
    visibleTabs.findIndex((tab) => tab.id === activeId)
  );

  useEffect(() => {
    const activeButton = tabRefs.current[activeIndex];
    if (activeButton) {
      activeButton.focus();
    }
  }, [activeIndex]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (visibleTabs.length === 0) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = (activeIndex + 1) % visibleTabs.length;
      onChange(visibleTabs[next].id);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prev = (activeIndex - 1 + visibleTabs.length) % visibleTabs.length;
      onChange(visibleTabs[prev].id);
      return;
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        minHeight: size === "sm" ? 40 : 44,
        overflowX: "hidden",
        width: "100%",
      }}
    >
      <Box
        role="tablist"
        onKeyDown={handleKeyDown}
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
          flex: 1,
          minWidth: 0,
        }}
      >
        {visibleTabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          const stripeColor = TAB_STRIPE[tab.id] ?? semanticColors.neutralStripe;
          const fillColor = isActive ? stripeColor : semanticColors.panel;
          const hoverFill = isActive ? stripeColor : semanticColors.panel2;
          const backgroundImage = `linear-gradient(90deg, ${stripeColor} 0 6px, ${fillColor} 6px 100%)`;
          const hoverBackgroundImage = `linear-gradient(90deg, ${stripeColor} 0 6px, ${hoverFill} 6px 100%)`;
          const shape =
            index === 0
              ? SHAPE_LEFT
              : index === visibleTabs.length - 1
                ? SHAPE_RIGHT
                : SHAPE_MID;
          return (
            <ButtonBase
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              sx={{
                position: "relative",
                height: size === "sm" ? 40 : 44,
                px: size === "sm" ? 2 : 2.5,
                border: `2px solid ${semanticColors.ink}`,
                backgroundColor: fillColor,
                backgroundImage,
                color: isActive ? textOn(fillColor) : semanticColors.ink,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 800,
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                justifyContent: "center",
                clipPath: shape,
                marginLeft: index === 0 ? 0 : -2,
                zIndex: isActive ? 3 : 1,
                transition: `background-color ${DUR.micro}ms ${EASE.snap}, color ${DUR.micro}ms ${EASE.snap}`,
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 3,
                  border: `1px solid ${
                    isActive ? semanticColors.ink2 : semanticColors.neutralStripe
                  }`,
                  clipPath: shape,
                  pointerEvents: "none",
                },
                "&:hover": {
                  backgroundColor: hoverFill,
                  backgroundImage: hoverBackgroundImage,
                  color: isActive ? textOn(fillColor) : semanticColors.ink,
                },
                "&.Mui-focusVisible": {
                  outline: `2px solid ${semanticColors.move}`,
                  outlineOffset: 2,
                },
                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",
                },
              }}
            >
              {tab.label}
            </ButtonBase>
          );
        })}
      </Box>
      {rightContent ? (
        <Box sx={{ ml: 2, whiteSpace: "nowrap" }}>{rightContent}</Box>
      ) : null}
    </Box>
  );
}
