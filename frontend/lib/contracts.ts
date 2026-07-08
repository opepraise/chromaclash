export const USDM_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;
export const CHROMACLASH_ADDRESS = "" as `0x${string}`; // fill after deploy

export const CHROMACLASH_ABI = [
  { name: "placePixel", type: "function", stateMutability: "nonpayable", inputs: [{ name: "x", type: "uint16" }, { name: "y", type: "uint16" }, { name: "colorIdx", type: "uint8" }], outputs: [] },
  { name: "placePixelPaid", type: "function", stateMutability: "nonpayable", inputs: [{ name: "x", type: "uint16" }, { name: "y", type: "uint16" }, { name: "colorIdx", type: "uint8" }], outputs: [] },
  { name: "placePixelBatch", type: "function", stateMutability: "nonpayable", inputs: [{ name: "xs", type: "uint16[]" }, { name: "ys", type: "uint16[]" }, { name: "colors", type: "uint8[]" }], outputs: [] },
  { name: "MAX_BATCH_SIZE", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "getPixelCooldown", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ name: "remaining", type: "uint256" }] },
  { name: "getPlayerPixels", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ name: "", type: "uint32" }] },
  { name: "currentEpoch", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "epochStart", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    name: "PixelPlaced", type: "event",
    inputs: [
      { name: "epoch", type: "uint256", indexed: true },
      { name: "placer", type: "address", indexed: true },
      { name: "x", type: "uint16", indexed: false },
      { name: "y", type: "uint16", indexed: false },
      { name: "colorIdx", type: "uint8", indexed: false },
      { name: "paid", type: "bool", indexed: false },
    ],
  },
  { name: "NewEpoch", type: "event", inputs: [{ name: "epoch", type: "uint256", indexed: true }, { name: "startTime", type: "uint256", indexed: false }] },
] as const;

export const ERC20_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

// 16 colors available on the palette
export const PALETTE = [
  "#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00",
  "#ff00ff", "#00ffff", "#ff8800", "#8800ff", "#00ff88", "#ff0088",
  "#888888", "#444444", "#ffccaa", "#aaccff",
] as const;
