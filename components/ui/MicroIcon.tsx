import Box from "@mui/material/Box";

type MicroIconProps = {
  name: "vp" | "turn" | "phase" | "status" | "mode" | "roll";
  size?: number;
  color?: string;
};

export default function MicroIcon({ name, size = 12, color = "#1B1B1B" }: MicroIconProps) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        width: size,
        height: size,
        color,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {name === "vp" ? (
          <path d="M12 3l2.2 4.6 5 .7-3.6 3.4.9 4.9L12 14.7 7.5 16.6l.9-4.9L4.8 8.3l5-.7L12 3z" />
        ) : null}
        {name === "turn" ? (
          <path d="M12 4a8 8 0 1 0 8 8h-2.2a5.8 5.8 0 1 1-1.7-4.1L14 10h6V4l-1.9 1.9A8 8 0 0 0 12 4z" />
        ) : null}
        {name === "phase" ? (
          <path d="M5 5h14v3H5V5zm0 6h14v3H5v-3zm0 6h14v3H5v-3z" />
        ) : null}
        {name === "status" ? (
          <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
        ) : null}
        {name === "mode" ? (
          <path d="M11 3h2v3h3v2h-3v3h-2V8H8V6h3V3zm1 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
        ) : null}
        {name === "roll" ? (
          <path d="M5 5h14v14H5V5zm3 3h3v3H8V8zm5 5h3v3h-3v-3zm-5 5h3v3H8v-3zm5-10h3v3h-3V8z" />
        ) : null}
      </svg>
    </Box>
  );
}
