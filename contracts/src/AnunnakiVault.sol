// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnunnakiVault
 * @notice Platform treasury vault. Funded by platform revenue (not pool circulation).
 *         Crack stages are irreversible and unlock platform-wide rate tiers.
 *         At 100%, Gate 2.0 opens and ceilings unlock permanently.
 *
 * Canon: The Vault governs limits and progression. It is not a user wallet.
 */
contract AnunnakiVault is Ownable {
    using SafeERC20 for IERC20;

    // ---- Crack Stages ----
    // Each stage is reached at a percentage threshold and is irreversible
    struct CrackStage {
        uint256 threshold;      // basis points (2000 = 20%)
        uint256 multiplierBP;   // multiplier in basis points (10000 = 1.0x)
        bool reached;
        uint256 reachedAt;      // timestamp
    }

    // ---- State ----
    uint256 public vaultBalance;
    uint256 public vaultTarget;       // target balance for 100%
    uint256 public progressBP;        // current progress in basis points (0-10000)
    uint256 public globalMultiplierBP; // current global multiplier (10000 = 1.0x)
    bool public gateOpen;             // true when 100% reached (Gate 2.0)
    bool public sentinelPaused;

    CrackStage[6] public stages;      // 0%, 20%, 40%, 60%, 80%, 100%
    
    // Monthly averages for sealed layer
    struct MonthlyRecord {
        uint256 month;          // YYYYMM
        uint256 avgProgress;
        uint256 timestamp;
    }
    MonthlyRecord[] public monthlyHistory;
    uint256 public sealedMultiplierBP; // sealed layer (can decay)

    // Accepted tokens
    mapping(address => bool) public acceptedTokens;
    mapping(address => uint256) public tokenBalances;

    // ---- Events ----
    event VaultFunded(address indexed token, uint256 amount, uint256 newProgress);
    event CrackStageReached(uint256 indexed stage, uint256 threshold, uint256 multiplier);
    event GateOpened(uint256 timestamp);
    event MonthlyRecorded(uint256 month, uint256 avgProgress);
    event SentinelPaused(string reason);
    event SentinelResumed();

    constructor(uint256 _vaultTarget) Ownable(msg.sender) {
        vaultTarget = _vaultTarget;
        globalMultiplierBP = 10000; // 1.0x
        sealedMultiplierBP = 10000;

        // Define crack stages: threshold (BP), multiplier (BP)
        stages[0] = CrackStage(0,     10000, true, block.timestamp); // 0% = 1.0x (always reached)
        stages[1] = CrackStage(2000,  11000, false, 0);  // 20% = 1.1x
        stages[2] = CrackStage(4000,  12000, false, 0);  // 40% = 1.2x
        stages[3] = CrackStage(6000,  14000, false, 0);  // 60% = 1.4x
        stages[4] = CrackStage(8000,  17000, false, 0);  // 80% = 1.7x
        stages[5] = CrackStage(10000, 20000, false, 0);  // 100% = 2.0x (Gate 2.0)
    }

    // ---- SENTINEL Controls ----
    function sentinelPause(string calldata reason) external onlyOwner {
        sentinelPaused = true;
        emit SentinelPaused(reason);
    }

    function sentinelResume() external onlyOwner {
        sentinelPaused = false;
        emit SentinelResumed();
    }

    // ---- Token Management ----
    function acceptToken(address token) external onlyOwner {
        acceptedTokens[token] = true;
    }

    // ---- Fund Vault (platform revenue deposits) ----
    function fund(address token, uint256 amount) external onlyOwner {
        require(!sentinelPaused, "SENTINEL: Vault paused");
        require(acceptedTokens[token], "Token not accepted");
        require(amount > 0, "Zero amount");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        vaultBalance += amount;
        tokenBalances[token] += amount;

        // Update progress
        if (vaultTarget > 0) {
            progressBP = (vaultBalance * 10000) / vaultTarget;
            if (progressBP > 10000) progressBP = 10000;
        }

        // Check crack stages (irreversible)
        _checkCrackStages();

        emit VaultFunded(token, amount, progressBP);
    }

    // ---- Crack Stage Logic ----
    function _checkCrackStages() internal {
        for (uint256 i = 1; i < 6; i++) {
            if (!stages[i].reached && progressBP >= stages[i].threshold) {
                stages[i].reached = true;
                stages[i].reachedAt = block.timestamp;
                globalMultiplierBP = stages[i].multiplierBP;
                
                emit CrackStageReached(i, stages[i].threshold, stages[i].multiplierBP);

                // Gate 2.0 at 100%
                if (i == 5) {
                    gateOpen = true;
                    emit GateOpened(block.timestamp);
                }
            }
        }
    }

    // ---- Monthly Average (Sealed Layer) ----
    function recordMonthlyAverage(uint256 month) external onlyOwner {
        monthlyHistory.push(MonthlyRecord({
            month: month,
            avgProgress: progressBP,
            timestamp: block.timestamp
        }));

        // Calculate sealed multiplier from rolling 12-month average
        uint256 len = monthlyHistory.length;
        uint256 lookback = len > 12 ? 12 : len;
        uint256 sum = 0;
        for (uint256 i = len - lookback; i < len; i++) {
            sum += monthlyHistory[i].avgProgress;
        }
        uint256 avg = sum / lookback;
        
        // Sealed multiplier: 0.8x to 1.5x based on average progress
        // avg 0 → 8000 BP (0.8x), avg 10000 → 15000 BP (1.5x)
        sealedMultiplierBP = 8000 + (avg * 7000) / 10000;
        if (sealedMultiplierBP > 15000) sealedMultiplierBP = 15000;

        emit MonthlyRecorded(month, avg);
    }

    // ---- View Functions ----
    function getCombinedMultiplier() external view returns (uint256) {
        // Global × Sealed, in basis points squared then normalized
        return (globalMultiplierBP * sealedMultiplierBP) / 10000;
    }

    function getCurrentStage() external view returns (uint256 stage, uint256 multiplier) {
        for (uint256 i = 5; i > 0; i--) {
            if (stages[i].reached) {
                return (i, stages[i].multiplierBP);
            }
        }
        return (0, 10000);
    }

    function getVaultInfo() external view returns (
        uint256 balance,
        uint256 target,
        uint256 progress,
        uint256 multiplier,
        bool gate,
        bool paused
    ) {
        return (vaultBalance, vaultTarget, progressBP, globalMultiplierBP, gateOpen, sentinelPaused);
    }
}
