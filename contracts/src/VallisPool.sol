// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VallisPool
 * @notice Any-token liquidity pool with disclosed-odds mechanics.
 *         Supports Dust, Dung, Flesh, BloodMoon, Obsidian tiers.
 *         SENTINEL-gated: owner can pause/unpause.
 *         Users deposit tokens → earn pool share → withdraw proportionally.
 *
 * Canon: Sentinel is first. If Sentinel denies, nothing executes.
 */
contract VallisPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---- Pool Configuration ----
    enum PoolTier { Dust, Dung, Flesh, BloodMoon, Obsidian }

    struct PoolConfig {
        string name;
        PoolTier tier;
        uint256 minDeposit;      // in token decimals
        uint256 maxDeposit;      // in token decimals
        uint256 aprBasisPoints;  // e.g. 800 = 8.00%
        uint256 capacityLimit;   // max TVL (0 = unlimited)
        bool active;
        bool eventOnly;          // BloodMoon: only active during events
    }

    struct UserDeposit {
        uint256 amount;
        uint256 depositTime;
        uint256 lastClaimTime;
        address token;
    }

    // ---- State ----
    PoolConfig public config;
    bool public sentinelPaused;  // SENTINEL emergency pause
    uint256 public totalDeposited;
    uint256 public totalShares;

    mapping(address => UserDeposit) public deposits;
    mapping(address => uint256) public shares;
    address[] public depositors;
    mapping(address => bool) public isDepositor;

    // Accepted tokens (any ERC20)
    mapping(address => bool) public acceptedTokens;
    address[] public tokenList;

    // ---- Events ----
    event Deposited(address indexed user, address indexed token, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event SentinelPaused(string reason);
    event SentinelResumed();
    event TokenAccepted(address indexed token);
    event PoolConfigUpdated();

    // ---- Modifiers ----
    modifier whenNotPaused() {
        require(!sentinelPaused, "SENTINEL: Pool paused");
        _;
    }

    modifier whenActive() {
        require(config.active, "Pool not active");
        if (config.eventOnly) {
            // BloodMoon: require explicit activation
            require(!config.eventOnly || config.active, "Event pool not active");
        }
        _;
    }

    constructor(
        string memory _name,
        PoolTier _tier,
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _aprBasisPoints,
        uint256 _capacityLimit
    ) Ownable(msg.sender) {
        config = PoolConfig({
            name: _name,
            tier: _tier,
            minDeposit: _minDeposit,
            maxDeposit: _maxDeposit,
            aprBasisPoints: _aprBasisPoints,
            capacityLimit: _capacityLimit,
            active: true,
            eventOnly: _tier == PoolTier.BloodMoon
        });
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
        require(token != address(0), "Invalid token");
        if (!acceptedTokens[token]) {
            acceptedTokens[token] = true;
            tokenList.push(token);
            emit TokenAccepted(token);
        }
    }

    // ---- Deposit ----
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused whenActive {
        require(acceptedTokens[token], "Token not accepted");
        require(amount >= config.minDeposit, "Below minimum deposit");
        require(amount <= config.maxDeposit, "Above maximum deposit");

        if (config.capacityLimit > 0) {
            require(totalDeposited + amount <= config.capacityLimit, "Pool at capacity");
        }

        // Transfer tokens to pool
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Calculate shares (1:1 for first depositor, proportional after)
        uint256 newShares;
        if (totalShares == 0) {
            newShares = amount;
        } else {
            newShares = (amount * totalShares) / totalDeposited;
        }

        // Update state
        if (!isDepositor[msg.sender]) {
            depositors.push(msg.sender);
            isDepositor[msg.sender] = true;
        }

        deposits[msg.sender] = UserDeposit({
            amount: deposits[msg.sender].amount + amount,
            depositTime: deposits[msg.sender].amount == 0 ? block.timestamp : deposits[msg.sender].depositTime,
            lastClaimTime: block.timestamp,
            token: token
        });

        shares[msg.sender] += newShares;
        totalShares += newShares;
        totalDeposited += amount;

        emit Deposited(msg.sender, token, amount, newShares);
    }

    // ---- Withdraw ----
    function withdraw(uint256 shareAmount) external nonReentrant whenNotPaused {
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");
        require(shareAmount > 0, "Zero withdrawal");

        // Calculate proportional amount
        uint256 amount = (shareAmount * totalDeposited) / totalShares;
        address token = deposits[msg.sender].token;

        // Update state
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposited -= amount;
        deposits[msg.sender].amount -= amount;

        // Transfer tokens back
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, token, amount);
    }

    // ---- View Functions ----
    function getUserShare(address user) external view returns (uint256 sharePercent) {
        if (totalShares == 0) return 0;
        return (shares[user] * 10000) / totalShares; // basis points
    }

    function getUserDeposit(address user) external view returns (uint256 amount, uint256 depositTime, address token) {
        UserDeposit memory d = deposits[user];
        return (d.amount, d.depositTime, d.token);
    }

    function getPoolInfo() external view returns (
        string memory name,
        uint256 tvl,
        uint256 depositorCount,
        uint256 apr,
        bool paused,
        bool active
    ) {
        return (
            config.name,
            totalDeposited,
            depositors.length,
            config.aprBasisPoints,
            sentinelPaused,
            config.active
        );
    }

    function getAcceptedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    function getDepositorCount() external view returns (uint256) {
        return depositors.length;
    }

    // ---- Admin ----
    function updateConfig(
        uint256 _minDeposit,
        uint256 _maxDeposit,
        uint256 _aprBasisPoints,
        uint256 _capacityLimit,
        bool _active
    ) external onlyOwner {
        config.minDeposit = _minDeposit;
        config.maxDeposit = _maxDeposit;
        config.aprBasisPoints = _aprBasisPoints;
        config.capacityLimit = _capacityLimit;
        config.active = _active;
        emit PoolConfigUpdated();
    }
}
