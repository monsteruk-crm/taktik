import { createTheme } from "@mui/material/styles";

const palette = {
  background: "#E6E6E2",
  text: "#1B1B1B",
  gray: "#8A8F94",
  red: "#C1121F",
  blue: "#1F4E79",
  yellow: "#F2B705",
};

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: palette.background,
      paper: palette.background,
    },
    text: {
      primary: palette.text,
      secondary: palette.gray,
    },
    primary: {
      main: palette.blue,
      contrastText: palette.background,
    },
    secondary: {
      main: palette.red,
      contrastText: palette.background,
    },
    warning: {
      main: palette.yellow,
      contrastText: palette.text,
    },
    error: {
      main: palette.red,
      contrastText: palette.background,
    },
  },
  shape: {
    borderRadius: 0,
  },
  typography: {
    fontFamily:
      "var(--font-geist-sans), 'IBM Plex Sans', 'DIN', 'Inter', sans-serif",
    allVariants: {
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "0.02em",
    },
    h1: { textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 },
    h2: { textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 },
    h3: { textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 },
    h4: { textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 },
    h5: { textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 },
    h6: { textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 },
    subtitle1: {
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 700,
    },
    subtitle2: {
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 600,
    },
    button: {
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background,
          color: palette.text,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `2px solid ${palette.text}`,
          backgroundColor: palette.background,
          boxShadow: "none",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 2,
            border: "1px solid rgba(27, 27, 27, 0.35)",
            pointerEvents: "none",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          borderWidth: 2,
          borderColor: palette.text,
          color: palette.text,
          minHeight: 28,
          padding: "4px 10px",
          "&:hover": {
            backgroundColor: palette.text,
            color: palette.background,
            borderColor: palette.text,
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
        },
        contained: {
          borderWidth: 2,
          borderColor: palette.text,
          "&:hover": {
            backgroundColor: palette.text,
            color: palette.background,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          backgroundColor: palette.text,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRight: `2px solid ${palette.text}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${palette.text}`,
          fontWeight: 700,
          letterSpacing: "0.06em",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${palette.text}`,
          backgroundColor: palette.background,
          "&:before": {
            display: "none",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 40,
          "&.Mui-expanded": {
            minHeight: 40,
          },
        },
        content: {
          margin: 0,
          "&.Mui-expanded": {
            margin: 0,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.text,
          borderWidth: 2,
        },
      },
    },
  },
});

export default theme;
