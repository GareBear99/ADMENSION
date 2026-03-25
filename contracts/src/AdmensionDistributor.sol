// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AdmensionDistributor
 * @notice Routes ADMENSION ad revenue: 13% to pool, distributed by contribution units.
 *         Revenue flows: AdSense payout (USD) → admin converts to stablecoin → deposits here
 *         → 13% routed to Dung pool → distributed to users by unit share → users claim.
 *
 * Flow: AdSense pays out → admin deposits stablecoin → contract splits 13% to pool
 *       → users claim based on their contribution units.
 *
 * Cap: $10,000/month (or $100,000 after 3 monthly summaries exist)
 */
contract AdmensionDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ---- Configuration ----
    uint256 public constant POOL_PERCENTAGE = 1300;  // 13.00% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public poolCap;                          // monthly cap in token units
    bool public sentinelPaused;

    // ---- State ----
    IERC20 public payoutToken;                       // stablecoin (USDT/USDC)
    address public dungPool;                          // Dung pool address

    struct MonthlySettlement {
        uint256 month;              // YYYYMM format
        uint256 totalRevenue;       // total revenue received
        uint256 poolAmount;         // 13% allocated to pool
        uint256 totalUnits;         // total contribution units
        uint256 distributed;        // amount actually distributed
        bool settled;
    }

    mapping(uint256 => MonthlySettlement) public settlements; // month => settlement
    uint256[] public settlementMonths;

    // User contribution units per month
    mapping(uint256 => mapping(address => uint256)) public userUnits;  // month => user => units
    mapping(uint256 => mapping(address => bool)) public claimed;       // month => user => claimed

    // User wallet addresses (set by users via ADMENSION UI)
    mapping(address => address) public payoutWallets;

    // ---- Events ----
    event RevenueDeposited(uint256 indexed month, uint256 amount, uint256 poolAmount);
    event UnitsRecorded(uint256 indexed month, address indexed user, uint256 units);
    event PayoutClaimed(uint256 indexed month, address indexed user, uint256 amount);
    event SettlementCompleted(uint256 indexed month, uint256 totalDistributed);
    event PoolCapUpdated(uint256 newCap);
    event SentinelPaused(string reason);
    event SentinelResumed();

    constructor(
        address _payoutToken,
        address _dungPool,
        uint256 _poolCap
    ) Ownable(msg.sender) {
        payoutToken = IERC20(_payoutToken);
        dungPool = _dungPool;
        poolCap = _poolCap;
    }

    // ---- SENTINEL ----
    function sentinelPause(string calldata reason) external onlyOwner {
        sentinelPaused = true;
        emit SentinelPaused(reason);
    }
    function sentinelResume() external onlyOwner {
        sentinelPaused = false;
        emit SentinelResumed();
    }

    // ---- Deposit Revenue (admin, after AdSense payout) ----
    function depositRevenue(uint256 month, uint256 amount) external onlyOwner {
        require(!sentinelPaused, "SENTINEL: Paused");
        require(amount > 0, "Zero amount");
        require(!settlements[month].settled, "Month already settled");

        payoutToken.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate 13% pool allocation (capped)
        uint256 poolAmount = (amount * POOL_PERCENTAGE) / BASIS_POINTS;
        if (poolAmount > poolCap) poolAmount = poolCap;

        if (settlements[month].totalRevenue == 0) {
            settlementMonths.push(month);
        }

        settlements[month].month = month;
        settlements[month].totalRevenue += amount;
        settlements[month].poolAmount += poolAmount;

        // Route pool portion to Dung pool
        if (dungPool != address(0)) {
            payoutToken.safeTransfer(dungPool, poolAmount);
        }

        // Update pool cap after 3 settlements
        if (settlementMonths.length >= 3 && poolCap < 100000 * 10**6) {
            poolCap = 100000 * 10**6; // $100,000 in USDT decimals
            emit PoolCapUpdated(poolCap);
        }

        emit RevenueDeposited(month, amount, poolAmount);
    }

    // ---- Record User Contribution Units (admin, from off-chain tracking) ----
    function recordUnits(uint256 month, address[] calldata users, uint256[] calldata units) external onlyOwner {
        require(users.length == units.length, "Length mismatch");
        require(!settlements[month].settled, "Already settled");

        for (uint256 i = 0; i < users.length; i++) {
            userUnits[month][users[i]] = units[i];
            settlements[month].totalUnits += units[i];
            emit UnitsRecorded(month, users[i], units[i]);
        }
    }

    // ---- Settle Month (finalize, enable claims) ----
    function settleMonth(uint256 month) external onlyOwner {
        require(!sentinelPaused, "SENTINEL: Paused");
        require(settlements[month].totalRevenue > 0, "No revenue");
        require(settlements[month].totalUnits > 0, "No units");
        require(!settlements[month].settled, "Already settled");

        settlements[month].settled = true;
        emit SettlementCompleted(month, settlements[month].poolAmount);
    }

    // ---- Claim Payout (users call this after settlement) ----
    function claim(uint256 month) external nonReentrant {
        require(!sentinelPaused, "SENTINEL: Paused");
        require(settlements[month].settled, "Not yet settled");
        require(!claimed[month][msg.sender], "Already claimed");
        require(userUnits[month][msg.sender] > 0, "No units");

        uint256 userShare = userUnits[month][msg.sender];
        uint256 totalUnits = settlements[month].totalUnits;
        uint256 poolAmount = settlements[month].poolAmount;

        // user_payout = pool × (user_units / total_units)
        uint256 payout = (poolAmount * userShare) / totalUnits;
        require(payout > 0, "Payout too small");

        claimed[month][msg.sender] = true;
        settlements[month].distributed += payout;

        // Send to user's payout wallet (or msg.sender if not set)
        address recipient = payoutWallets[msg.sender] != address(0)
            ? payoutWallets[msg.sender]
            : msg.sender;

        payoutToken.safeTransfer(recipient, payout);

        emit PayoutClaimed(month, msg.sender, payout);
    }

    // ---- Set Payout Wallet ----
    function setPayoutWallet(address wallet) external {
        payoutWallets[msg.sender] = wallet;
    }

    // ---- View Functions ----
    function getUserPayout(uint256 month, address user) external view returns (uint256) {
        if (settlements[month].totalUnits == 0) return 0;
        return (settlements[month].poolAmount * userUnits[month][user]) / settlements[month].totalUnits;
    }

    function getSettlement(uint256 month) external view returns (
        uint256 revenue, uint256 pool, uint256 units, uint256 distributed, bool settled
    ) {
        MonthlySettlement memory s = settlements[month];
        return (s.totalRevenue, s.poolAmount, s.totalUnits, s.distributed, s.settled);
    }

    function getSettlementCount() external view returns (uint256) {
        return settlementMonths.length;
    }

    // ---- Admin ----
    function setDungPool(address _pool) external onlyOwner {
        dungPool = _pool;
    }

    function setPoolCap(uint256 _cap) external onlyOwner {
        poolCap = _cap;
        emit PoolCapUpdated(_cap);
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
