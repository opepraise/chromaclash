# ChromaClash

Pixel canvas war on Celo. Paint, claim, and conquer a shared 100×100 canvas against the world.

## Overview

Inspired by r/Place — ChromaClash is a competitive pixel canvas where every address fights for territory. Canvas state is rebuilt from on-chain events. Epochs reset weekly so the battle never ends.

## Game Mechanics

- 100×100 shared canvas (10,000 pixels)
- **Free**: place 1 pixel every 5 minutes at no cost
- **Paid**: place immediately for 0.01 USDM (30s cooldown)
- **Batch**: 5 pixels for 0.04 USDM (4th free)
- Paint over opponents' pixels to claim them
- Your score = pixels you currently own on the canvas
- Epoch lasts 7 days — top pixel-holder earns from the fee pool
- New epoch = fresh battle, same canvas wiped

## Features

- 16-color palette
- Real-time canvas via on-chain event streaming
- Optimistic UI — paint shows immediately, confirmed on-chain
- Epoch countdown and live pixel count
- Completely free to start playing

## Stack

- **Frontend**: Next.js 14, TailwindCSS, wagmi v2, viem, HTML5 Canvas
- **Contracts**: Solidity 0.8.20, Hardhat, OpenZeppelin
- **Chain**: Celo mainnet

## Setup

```bash
cd contracts && npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network celo

# Update CHROMACLASH_ADDRESS in frontend/lib/contracts.ts
cd ../frontend && npm install
npm run dev
```
