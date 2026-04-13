#!/bin/bash
# scripts/deploy-contracts.sh
# Deploy WePaySubnameRegistrar to Ethereum mainnet (or sepolia for testing).

set -e

NETWORK=${1:-sepolia}

echo "═══════════════════════════════════════════"
echo " WePay Contract Deploy — $NETWORK"
echo "═══════════════════════════════════════════"

cd ../contracts

echo "🔨 Compiling contracts..."
npm run compile

echo ""
echo "🚀 Deploying WePaySubnameRegistrar to $NETWORK..."
if [ "$NETWORK" = "mainnet" ]; then
  npm run deploy
else
  npm run deploy:sepolia
fi

echo ""
echo "✅ Deployment complete. See contracts/deployments/$NETWORK.json"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Wrap + lock wepay.eth in ENS Manager"
echo "   2. Approve registrar as NameWrapper operator"
echo "   3. Run: registrar.verifyParentLocked()"
echo "   4. Update NEXT_PUBLIC_WEPAY_REGISTRAR_ADDRESS in .env"
