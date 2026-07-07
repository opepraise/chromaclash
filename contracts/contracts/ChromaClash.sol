// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice ChromaClash — on-chain pixel canvas war. Players place colored pixels on a shared canvas.
/// Free to place; optional USDM to place faster or buy color packs. Canvas state is rebuilt from events.
contract ChromaClash is Ownable, ReentrancyGuard {
    IERC20 public immutable usdm;

    uint16 public constant WIDTH = 100;
    uint16 public constant HEIGHT = 100;
    uint256 public constant FREE_COOLDOWN = 5 minutes;
    uint256 public constant PAID_COOLDOWN = 30 seconds;
    uint256 public constant PAID_PIXEL_COST = 0.01 ether; // 0.01 USDM

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

    // Color palette index → color (stored as bytes3 = RGB)
    // Colors defined off-chain, on-chain we just store palette index 0-15
    uint8 public constant MAX_COLORS = 16;

    uint256 public platformFeeBalance;

    event PixelPlaced(
        uint256 indexed epoch,
        address indexed placer,
        uint16 x,
        uint16 y,
        uint8 colorIdx,
        bool paid
    );
    event EpochEnded(uint256 indexed epoch, address indexed topPlayer, uint32 pixels);
    event NewEpoch(uint256 indexed epoch, uint256 startTime);

    constructor(address _usdm) Ownable(msg.sender) {
        usdm = IERC20(_usdm);
        epochStart = block.timestamp;
        currentEpoch = 0;
        emit NewEpoch(0, block.timestamp);
    }

    /// @notice Place a single pixel for free (subject to cooldown)
    function placePixel(uint16 x, uint16 y, uint8 colorIdx) external {
        require(x < WIDTH && y < HEIGHT, "Out of bounds");
        require(colorIdx < MAX_COLORS, "Invalid color");
        require(block.timestamp >= lastPlaced[currentEpoch][msg.sender] + FREE_COOLDOWN, "Cooldown active");

        _place(x, y, colorIdx, false);
    }

    /// @notice Place a pixel immediately by paying USDM (bypasses cooldown)
    function placePixelPaid(uint16 x, uint16 y, uint8 colorIdx) external nonReentrant {
        require(x < WIDTH && y < HEIGHT, "Out of bounds");
        require(colorIdx < MAX_COLORS, "Invalid color");
        require(block.timestamp >= lastPlaced[currentEpoch][msg.sender] + PAID_COOLDOWN, "Paid cooldown active");
        require(usdm.transferFrom(msg.sender, address(this), PAID_PIXEL_COST), "Payment failed");

        platformFeeBalance += PAID_PIXEL_COST;
        _place(x, y, colorIdx, true);
    }

    /// @notice Place 5 pixels at once (paid — 0.04 USDM for 5, slight discount)
    function placePixelBatch(uint16[5] calldata xs, uint16[5] calldata ys, uint8[5] calldata colors) external nonReentrant {
        uint256 batchCost = PAID_PIXEL_COST * 4; // pay for 4, get 5th free
        require(usdm.transferFrom(msg.sender, address(this), batchCost), "Payment failed");
        platformFeeBalance += batchCost;

        for (uint8 i = 0; i < 5; i++) {
            require(xs[i] < WIDTH && ys[i] < HEIGHT, "Out of bounds");
            require(colors[i] < MAX_COLORS, "Invalid color");
            _place(xs[i], ys[i], colors[i], true);
        }
    }

    function _place(uint16 x, uint16 y, uint8 colorIdx, bool paid) internal {
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

        if (!paid) {
            lastPlaced[currentEpoch][msg.sender] = block.timestamp;
        } else {
            // Paid cooldown is much shorter
            lastPlaced[currentEpoch][msg.sender] = block.timestamp - FREE_COOLDOWN + PAID_COOLDOWN;
        }

        emit PixelPlaced(currentEpoch, msg.sender, x, y, colorIdx, paid);
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
        uint256 ready = last + FREE_COOLDOWN;
        if (block.timestamp >= ready) return 0;
        return ready - block.timestamp;
    }

    function getPlayerPixels(address player) external view returns (uint32) {
        return pixelCount[currentEpoch][player];
    }

    function getPlayerPixelsForEpoch(address player, uint256 epoch) external view returns (uint32) {
        return pixelCount[epoch][player];
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = platformFeeBalance;
        platformFeeBalance = 0;
        require(usdm.transfer(owner(), amount), "Transfer failed");
    }

    function forceAdvanceEpoch() external onlyOwner {
        currentEpoch++;
        epochStart = block.timestamp;
        emit NewEpoch(currentEpoch, block.timestamp);
    }
}
