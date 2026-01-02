import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";

type TabItem = { label: string };

const SkewedTabsConditional: React.FC = () => {
  const [value, setValue] = useState(0);

  const tabItems: TabItem[] = [
    { label: "Start" },
    { label: "Middle" },
    { label: "End" },
  ];

  const slant = 20;

  const getClipPath = (index: number, total: number) => {
    if (index === 0) {
      return `polygon(0% 0%, 100% 0%, calc(100% - ${slant}px) 100%, 0% 100%)`;
    }
    if (index === total - 1) {
      return `polygon(${slant}px 0%, 100% 0%, 100% 100%, 0% 100%)`;
    }
    return `polygon(${slant}px 0%, 100% 0%, calc(100% - ${slant}px) 100%, 0% 100%)`;
  };

  return (
    <Box sx={{ width: "100%", bgcolor: "#f5f5f5", p: 4 }}>
      <Tabs
        value={value}
        onChange={(event: React.SyntheticEvent, newValue: number) => setValue(newValue)}
        TabIndicatorProps={{ style: { display: "none" } }}
        sx={{
          width: "100%",
          "& .MuiTabs-flexContainer": {
            // Pull tabs together so the slanted edges interlock.
            marginLeft: `-${slant}px`,
          },
        }}
      >
        {tabItems.map((item, index) => (
          <Tab
            key={index}
            label={item.label}
            sx={{
              minWidth: 0,
              flex: 1,
              fontWeight: "bold",
              bgcolor: value === index ? "primary.main" : "grey.400",
              color: value === index ? "white" : "black",
              transition: "background-color 0.2s",
              clipPath: getClipPath(index, tabItems.length),
              px: 4,
              ml: index === 0 ? 0 : `-${slant}px`,
              "&.Mui-selected": { color: "white" },
              "&:hover": {
                bgcolor: value === index ? "primary.dark" : "grey.500",
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default SkewedTabsConditional;
