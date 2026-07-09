// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice ChromaClash — on-chain pixel canvas war. Completely free to play; a short
/// per-address cooldown is the only thing standing between you and total canvas domination.
/// Canvas state is rebuilt from events.
contract ChromaClash is Ownable {
    uint16 public constant WIDTH = 100;
    uint16 public constant HEIGHT = 100;
    uint256 public constant COOLDOWN = 5 seconds;

    // Epoch: each epoch is a new "battle round" (1 week)
    uint256 public currentEpoch;
    uint256 public epochStart;
    uint256 public constant EPOCH_DURATION = 7 days;

    // Track pixel ownership for scoring
    // pixelOwner[epoch][x][y] = address
    mapping(uint256 => mapping(uint16 => mapping(uint16 => address))) public pixelOwner;

    // Cooldown per address per epoch
    mapping(uint256 => mapping(address => uint256)) public lastPlaced;

    // Score per address per epoch (pixels owned)
    mapping(uint256 => mapping(address => uint32)) public pixelCount;

    // Color palette index → color (defined off-chain, on-chain we just store palette index 0-15)
    uint8 public constant MAX_COLORS = 16;

    event PixelPlaced(uint256 indexed epoch, address indexed placer, uint16 x, uint16 y, uint8 colorIdx);
    event NewEpoch(uint256 indexed epoch, uint256 startTime);

    constructor() Ownable(msg.sender) {
        epochStart = block.timestamp;
        currentEpoch = 0;
        emit NewEpoch(0, block.timestamp);
    }

    /// @notice Place a pixel for free, subject to a short per-address cooldown.
    function placePixel(uint16 x, uint16 y, uint8 colorIdx) external {
        require(x < WIDTH && y < HEIGHT, "Out of bounds");
        require(colorIdx < MAX_COLORS, "Invalid color");
        require(block.timestamp >= lastPlaced[currentEpoch][msg.sender] + COOLDOWN, "Cooldown active");

        _maybeAdvanceEpoch();

        address prev = pixelOwner[currentEpoch][x][y];
        if (prev != address(0) && prev != msg.sender) {
            // Previous owner loses this pixel
            if (pixelCount[currentEpoch][prev] > 0) {
                pixelCount[currentEpoch][prev]--;
            }
        }

        pixelOwner[currentEpoch][x][y] = msg.sender;
        pixelCount[currentEpoch][msg.sender]++;
        lastPlaced[currentEpoch][msg.sender] = block.timestamp;

        emit PixelPlaced(currentEpoch, msg.sender, x, y, colorIdx);
    }

    function _maybeAdvanceEpoch() internal {
        if (block.timestamp >= epochStart + EPOCH_DURATION) {
            currentEpoch++;
            epochStart = block.timestamp;
            emit NewEpoch(currentEpoch, block.timestamp);
        }
    }

    function getPixelCooldown(address player) external view returns (uint256 remaining) {
        uint256 last = lastPlaced[currentEpoch][player];
        if (last == 0) return 0;
        uint256 ready = last + COOLDOWN;
        if (block.timestamp >= ready) return 0;
        return ready - block.timestamp;
    }

    function getPlayerPixels(address player) external view returns (uint32) {
        return pixelCount[currentEpoch][player];
    }

    function getPlayerPixelsForEpoch(address player, uint256 epoch) external view returns (uint32) {
        return pixelCount[epoch][player];
    }

    function forceAdvanceEpoch() external onlyOwner {
        currentEpoch++;
        epochStart = block.timestamp;
        emit NewEpoch(currentEpoch, block.timestamp);
    }
}
