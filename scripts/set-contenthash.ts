import { createWalletClient, createPublicClient, http, toBytes, encodePacked } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { namehash } from "viem/ens";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const ENS_PUBLIC_RESOLVER = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as const;

const RESOLVER_ABI = [
  {
    name: "setContenthash",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "hash", type: "bytes"   },
    ],
    outputs: [],
  },
] as const;

/**
 * Encode an IPFS CID as EIP-1577 contenthash bytes.
 * Format: 0xe3010170 (IPFS codec prefix) + CID bytes
 */
function encodeIpfsCid(cid: string): `0x${string}` {
  // EIP-1577 IPFS contenthash prefix: e3 01 01 70
  const prefix  = new Uint8Array([0xe3, 0x01, 0x01, 0x70]);
  const cidBytes = Buffer.from(cid, "base58");  // CIDv0 is base58-encoded
  const combined = new Uint8Array(prefix.length + cidBytes.length);
  combined.set(prefix, 0);
  combined.set(cidBytes, prefix.length);
  return `0x${Buffer.from(combined).toString("hex")}`;
}

async function main() {
  const args   = process.argv.slice(2);
  const cidIdx = args.indexOf("--cid");
  const domIdx = args.indexOf("--domain");

  if (cidIdx === -1 || domIdx === -1) {
    console.error("Usage: ts-node set-contenthash.ts --cid <CID> --domain <domain.eth>");
    process.exit(1);
  }

  const cid    = args[cidIdx + 1];
  const domain = args[domIdx + 1];

  console.log(`Setting contenthash for ${domain} → ipfs://${cid}`);

  const account      = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(process.env.ETH_RPC_URL),
  });
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.ETH_RPC_URL),
  });

  const node        = namehash(domain);
  const contenthash = encodeIpfsCid(cid);

  const hash = await walletClient.writeContract({
    address: ENS_PUBLIC_RESOLVER,
    abi:     RESOLVER_ABI,
    functionName: "setContenthash",
    args: [node, toBytes(contenthash)],
  });

  console.log(`TX submitted: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(`   ${domain} → ipfs://${cid}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
