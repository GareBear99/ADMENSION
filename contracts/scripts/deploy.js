/**
 * VALLIS Contract Deployment Script
 * Deploys: 5 pools (Dust, Dung, Flesh, BloodMoon, Obsidian)
 *          + AnunnakiVault + AdmensionDistributor
 *
 * Usage: npx hardhat run scripts/deploy.js --network <network>
 *
 * Networks: localhost, goerli, mainnet, tron_shasta, tron_mainnet
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Stablecoin address (USDT) - UPDATE FOR YOUR NETWORK
  // Ethereum mainnet USDT: 0xdAC17F958D2ee523a2206206994597C13D831ec7
  // Goerli test USDT: deploy a mock
  // TRON USDT: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
  const USDT_ADDRESS = process.env.USDT_ADDRESS || "0x0000000000000000000000000000000000000000";

  // ---- Deploy Pools ----
  const VallisPool = await hre.ethers.getContractFactory("VallisPool");

  // Pool configs: name, tier, minDeposit (6 decimals for USDT), maxDeposit, APR (BP), capacityLimit
  const pools = [
    { name: "Dust",      tier: 0, min: 10e6,  max: 50e6,  apr: 600,  cap: 500000e6 },
    { name: "Dung",      tier: 1, min: 10e6,  max: 75e6,  apr: 1100, cap: 1000000e6 },
    { name: "Flesh",     tier: 2, min: 15e6,  max: 100e6, apr: 1800, cap: 750000e6 },
    { name: "BloodMoon", tier: 3, min: 20e6,  max: 100e6, apr: 3000, cap: 500000e6 },
    { name: "Obsidian",  tier: 4, min: 25e6,  max: 100e6, apr: 4500, cap: 250000e6 },
  ];

  const deployedPools = {};
  for (const p of pools) {
    console.log(`\nDeploying ${p.name} pool...`);
    const pool = await VallisPool.deploy(p.name, p.tier, p.min, p.max, p.apr, p.cap);
    await pool.waitForDeployment();
    const addr = await pool.getAddress();
    deployedPools[p.name] = addr;
    console.log(`  ${p.name}: ${addr}`);

    // Accept USDT in each pool
    if (USDT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      await pool.acceptToken(USDT_ADDRESS);
      console.log(`  Accepted USDT`);
    }
  }

  // ---- Deploy Anunnaki Vault ----
  console.log("\nDeploying Anunnaki Vault...");
  const AnunnakiVault = await hre.ethers.getContractFactory("AnunnakiVault");
  const vault = await AnunnakiVault.deploy(1000000e6); // $1M target
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`  Vault: ${vaultAddr}`);

  if (USDT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    await vault.acceptToken(USDT_ADDRESS);
    console.log("  Accepted USDT");
  }

  // ---- Deploy ADMENSION Distributor ----
  console.log("\nDeploying ADMENSION Distributor...");
  const AdmensionDistributor = await hre.ethers.getContractFactory("AdmensionDistributor");
  const distributor = await AdmensionDistributor.deploy(
    USDT_ADDRESS,
    deployedPools["Dung"], // Route 13% to Dung pool
    10000e6                // $10,000 monthly cap
  );
  await distributor.waitForDeployment();
  const distAddr = await distributor.getAddress();
  console.log(`  Distributor: ${distAddr}`);

  // ---- Summary ----
  console.log("\n========================================");
  console.log("VALLIS DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("\nPools:");
  for (const [name, addr] of Object.entries(deployedPools)) {
    console.log(`  ${name}: ${addr}`);
  }
  console.log(`\nAnunnaki Vault: ${vaultAddr}`);
  console.log(`ADMENSION Distributor: ${distAddr}`);
  console.log(`Payout Token (USDT): ${USDT_ADDRESS}`);
  console.log(`Dung Pool (revenue routing): ${deployedPools["Dung"]}`);
  console.log("\n========================================");

  // Save deployment addresses
  const deployment = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      pools: deployedPools,
      vault: vaultAddr,
      distributor: distAddr,
      payoutToken: USDT_ADDRESS,
    }
  };

  const fs = require("fs");
  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\nDeployment saved to deployments/${hre.network.name}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
