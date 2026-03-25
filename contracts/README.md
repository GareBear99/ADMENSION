# VALLIS Smart Contracts

## Architecture

```
AdSense Payout (USD)
       │
       ▼
Admin converts to USDT
       │
       ▼
┌──────────────────────┐
│ AdmensionDistributor │ ← depositRevenue(month, amount)
│   13% pool split     │
│   $10K cap/month     │
└──────┬───────────────┘
       │ 13% routed to
       ▼
┌──────────────┐     ┌──────────────┐
│  Dung Pool   │     │ AnunnakiVault│
│  (revenue)   │     │ (treasury)   │
└──────┬───────┘     └──────┬───────┘
       │                     │
       │ users claim         │ crack stages
       ▼                     ▼
  User Wallets         Global Multiplier
  (TRON/ETH/BTC)      (1.0x → 2.0x)
```

## Contracts

### VallisPool.sol
Any-token liquidity pool. Deployed 5 times for each tier:
- **Dust** — Entry-level (4-8% APR, $10-$50)
- **Dung** — Standard (8-14% APR, $10-$75) — **ADMENSION revenue routes here**
- **Flesh** — Elevated (14-22% APR, $15-$100)
- **BloodMoon** — Event-only (20-40% APR, $20-$100)
- **Obsidian** — Max risk (30-60% APR, $25-$100, requires RETAINED+ tier)

Features:
- Accept any ERC20 token
- Proportional share tracking
- SENTINEL pause/resume
- Capacity limits per pool

### AnunnakiVault.sol
Platform treasury. Funded by platform revenue (not pool circulation).
- 6 irreversible crack stages (0%, 20%, 40%, 60%, 80%, 100%)
- Global multiplier increases at each stage (1.0x → 2.0x)
- Sealed layer: monthly average tracking with decay
- Gate 2.0 opens at 100% (permanent ceiling unlock)

### AdmensionDistributor.sol
Revenue distribution. Routes ad revenue through the system:
- Admin deposits stablecoin after AdSense/ad network payout
- Contract splits 13% to Dung pool
- Records user contribution units (from off-chain tracking)
- Users claim proportional share after monthly settlement
- Cap: $10K/month (auto-upgrades to $100K after 3 settlements)

## Deployment

### Prerequisites
```bash
cd contracts
npm install
```

### Local testing
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet (Goerli/Sepolia)
```bash
# Set env vars
export PRIVATE_KEY=your_deployer_private_key
export USDT_ADDRESS=0x_testnet_usdt_address

npx hardhat run scripts/deploy.js --network goerli
```

### Mainnet
```bash
export PRIVATE_KEY=your_deployer_private_key
export USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7

npx hardhat run scripts/deploy.js --network mainnet
```

## Revenue Flow (Monthly)

1. **AdSense pays out** → admin receives USD
2. **Admin converts** USD → USDT (via exchange)
3. **Admin calls** `distributor.depositRevenue(202603, amount)` → 13% auto-routes to Dung pool
4. **Admin records units** `distributor.recordUnits(202603, users[], units[])` from off-chain tracking
5. **Admin settles** `distributor.settleMonth(202603)` → enables claims
6. **Users claim** `distributor.claim(202603)` → USDT sent to their wallet

## SENTINEL Integration

Every contract has `sentinelPause(reason)` / `sentinelResume()`:
- Pauses all deposits, withdrawals, and claims
- Only callable by contract owner
- Matches the frontend SENTINEL entity behavior

## Security Notes

- All contracts use OpenZeppelin v5 (audited)
- ReentrancyGuard on all state-changing functions
- SafeERC20 for all token transfers
- No flash loan vulnerabilities (proportional shares)
- Crack stages are irreversible (no rollback)
