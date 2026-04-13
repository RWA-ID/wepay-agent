import { run, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const deploymentFile = path.join(__dirname, `../deployments/${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`No deployment found for network: ${network.name}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const { address } = deployments.WePaySubnameRegistrar;

  if (!address) {
    throw new Error("WePaySubnameRegistrar address not found in deployment file");
  }

  console.log(`Verifying WePaySubnameRegistrar at ${address} on ${network.name}...`);

  // WePaySubnameRegistrar has no constructor arguments
  await run("verify:verify", {
    address,
    constructorArguments: [],
  });

  console.log("✅ Verified on Etherscan");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
