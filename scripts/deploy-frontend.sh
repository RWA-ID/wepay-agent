#!/bin/bash
# scripts/deploy-frontend.sh
# Build the Next.js static export, pin to IPFS via Pinata, and set wepay.eth contenthash.

set -e

echo "═══════════════════════════════════════════"
echo " WePay Frontend Deploy"
echo "═══════════════════════════════════════════"

# Load root .env
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

echo "🔨 Building Next.js static export..."
cd ../frontend
npm run build
echo "✅ Build complete — output in ./out"

echo ""
echo "📦 Pinning to IPFS via Pinata CLI..."
# Requires: npm install -g pinata-cli (or use npx)
CID=$(npx pinata upload ./out --json 2>/dev/null | jq -r '.cid')

if [ -z "$CID" ]; then
  echo "❌ Pinning failed — check PINATA_JWT in .env"
  exit 1
fi

echo "✅ Pinned: ipfs://$CID"

echo ""
echo "🔗 Setting wepay.eth contenthash..."
cd ..
npx ts-node scripts/set-contenthash.ts --cid "$CID" --domain "wepay.eth"

echo ""
echo "🌐 Done!"
echo "   wepay.eth → ipfs://$CID"
echo "   View at: https://wepay.eth.limo"
