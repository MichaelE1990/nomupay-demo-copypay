#\!/bin/bash
echo "Testing webhook endpoint..."
curl -X POST https://nomupay-demo-copypay.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -H "X-Initialization-Vector: 000000000000000000000000" \
  -H "X-Authentication-Tag: test" \
  -d "{\"encryptedBody\": \"test\"}" 2>&1 | grep -v "^%" | head -5

echo ""
echo "Testing webhook viewer..."
curl -s https://nomupay-demo-copypay.vercel.app/webhooks/view | grep -o "<title>.*</title>"
