import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" WePaySubnameRegistrar — Deploy Script");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Network  :", network.name);
  console.log("  Deployer :", deployer.address);
  console.log("  Balance  :", ethers.formatEther(balance), "ETH");
  console.log("───────────────────────────────────────────────────────────");

  if (balance === 0n) {
    throw new Error("Deployer has no ETH — fund the wallet first");
  }

  const Factory = await ethers.getContractFactory("WePaySubnameRegistrar");
  console.log("Deploying WePaySubnameRegistrar...");

  const registrar = await Factory.deploy();
  await registrar.waitForDeployment();

  const address = await registrar.getAddress();
  const deployTx = registrar.deploymentTransaction();

  console.log("\n✅ WePaySubnameRegistrar deployed to:", address);
  console.log("   Tx hash:", deployTx?.hash);
  console.log("   Gas used:", deployTx?.gasLimit?.toString());

  // Persist deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  const existing = fs.existsSync(deploymentFile)
    ? JSON.parse(fs.readFileSync(deploymentFile, "utf8"))
    : {};

  const deploymentData = {
    ...existing,
    WePaySubnameRegistrar: {
      address,
      deployedAt: new Date().toISOString(),
      txHash: deployTx?.hash,
      deployer: deployer.address,
    },
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log(`\n📄 Deployment saved to deployments/${network.name}.json`);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  REQUIRED MANUAL STEPS AFTER DEPLOYMENT                   ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  1. Wrap wepay.eth in ENS NameWrapper (if not done):      ║
║     → https://app.ens.domains/wepay.eth → Wrap Name      ║
║                                                           ║
║  2. Lock wepay.eth — burn CANNOT_UNWRAP (IRREVERSIBLE):   ║
║     → ENS Manager → Permissions → Revoke unwrap          ║
║                                                           ║
║  3. Approve this registrar as NameWrapper operator:       ║
║     Call on NameWrapper (0xD4416b...):                    ║
║     setApprovalForAll("${address}", true)  ║
║     → From your wepay.eth owner wallet                    ║
║                                                           ║
║  4. Verify setup:                                         ║
║     registrar.verifyParentLocked() → must be (true, exp) ║
║                                                           ║
║  5. Update .env:                                          ║
║     NEXT_PUBLIC_WEPAY_REGISTRAR_ADDRESS=${address}  ║
║                                                           ║
║  6. Verify on Etherscan:                                  ║
║     npm run verify                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
