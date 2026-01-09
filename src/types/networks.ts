export type Edge = "N" | "E" | "S" | "W";
export type Cell = { x: number; y: number };

export type NetworkConnectors = {
  road?: Edge[];
  river?: Edge[];
};
