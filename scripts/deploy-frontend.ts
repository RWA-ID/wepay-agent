/**
 * Pin the Next.js static export to Pinata IPFS and print the CID
 * to set as the wepay.eth contenthash.
 *
 * Usage:
 *   1. cd frontend && npm run build   (creates frontend/out/)
 *   2. cd ..
 *   3. PINATA_JWT=xxx PINATA_GATEWAY=xxx npx tsx scripts/deploy-frontend.ts
 *
 * Then set wepay.eth contenthash to ipfs://<CID> via ENS Manager.
 */

import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { PinataSDK } from "pinata";

const BUILD_DIR = join(import.meta.dirname, "../frontend/out");
const pinata    = new PinataSDK({
  pinataJwt:     process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

function walkDir(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => {
    const full = join(dir, e.name);
    return e.isDirectory() ? walkDir(full) : [full];
  });
}

const allFiles = walkDir(BUILD_DIR);
console.log(`Pinning ${allFiles.length} files from ${BUILD_DIR}…`);

const fileObjects = allFiles.map((filePath) => {
  const name = relative(BUILD_DIR, filePath);
  const buffer = readFileSync(filePath);
  return new File([buffer], name);
});

const result = await pinata.upload.public.fileArray(fileObjects, {
  metadata: {
    name: "wepay-frontend",
    keyvalues: { version: new Date().toISOString() },
  },
});

console.log("\n✅ Frontend pinned to IPFS");
console.log(`CID: ${result.cid}`);
console.log(`\nGateway URL: https://gateway.pinata.cloud/ipfs/${result.cid}`);
console.log(`\nSet wepay.eth contenthash via ENS Manager to:`);
console.log(`  ipfs://${result.cid}`);
