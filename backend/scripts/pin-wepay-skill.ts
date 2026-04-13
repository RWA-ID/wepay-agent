/**
 * One-time script: pin the WePay bill-pay skill to Pinata IPFS.
 * Run once, then set WEPAY_SKILL_CID in Railway env vars.
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/pin-wepay-skill.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PinataSDK } from "pinata";

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillPath = join(__dirname, "../src/skills/wepay-bill-pay.md");
const skillMd   = readFileSync(skillPath, "utf-8");

const pinata = new PinataSDK({
  pinataJwt:     process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

const file   = new File([skillMd], "skill.md", { type: "text/markdown" });
const result = await pinata.upload.public.file(file, {
  metadata: {
    name: "wepay-bill-pay-skill",
    keyvalues: { skill: "wepay-bill-pay", version: "1.0.0" },
  },
});

console.log("\n✅ WePay bill-pay skill pinned to IPFS");
console.log(`CID: ${result.cid}`);
console.log(`\nAdd this to your Railway environment variables:`);
console.log(`WEPAY_SKILL_CID=${result.cid}`);
