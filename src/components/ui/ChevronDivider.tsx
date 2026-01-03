import Box from "@mui/material/Box";

export default function ChevronDivider() {
  return (
    <Box
      sx={{
        width: 18,
        height: 22,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          width: 8,
          height: "100%",
          border: "2px solid #1B1B1B",
          backgroundColor: "#E6E6E2",
          clipPath: "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%, 30% 50%)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 8,
          width: 8,
          height: "100%",
          border: "2px solid #1B1B1B",
          backgroundColor: "#E6E6E2",
          clipPath: "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%, 30% 50%)",
        }}
      />
    </Box>
  );
}
