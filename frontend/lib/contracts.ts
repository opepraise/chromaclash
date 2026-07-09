export const CHROMACLASH_ADDRESS = "0xDDF8f6647bE7E9720257A9452ED7901570874c37" as `0x${string}`;
// Block the contract was deployed at — bounds event log queries so we don't scan from chain genesis.
export const CHROMACLASH_DEPLOY_BLOCK = 71685900n;

export const CHROMACLASH_ABI = [
  { name: "placePixel", type: "function", stateMutability: "nonpayable", inputs: [{ name: "x", type: "uint16" }, { name: "y", type: "uint16" }, { name: "colorIdx", type: "uint8" }], outputs: [] },
  { name: "getPixelCooldown", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ name: "remaining", type: "uint256" }] },
  { name: "getPlayerPixels", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ name: "", type: "uint32" }] },
  { name: "currentEpoch", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "epochStart", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "lastPlaced", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "COOLDOWN", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    name: "PixelPlaced", type: "event",
    inputs: [
      { name: "epoch", type: "uint256", indexed: true },
      { name: "placer", type: "address", indexed: true },
      { name: "x", type: "uint16", indexed: false },
      { name: "y", type: "uint16", indexed: false },
      { name: "colorIdx", type: "uint8", indexed: false },
    ],
  },
  { name: "NewEpoch", type: "event", inputs: [{ name: "epoch", type: "uint256", indexed: true }, { name: "startTime", type: "uint256", indexed: false }] },
] as const;

// 16 colors available on the palette
export const PALETTE = [
  "#FFFFFF", "#E4E4E4", "#888888", "#222222", "#FFA7D1", "#E50000", "#E59500", "#A06A42",
  "#E5D900", "#94E044", "#02BE01", "#00D3DD", "#0083C7", "#0000EA", "#CF6EE4", "#820080",
] as const;
