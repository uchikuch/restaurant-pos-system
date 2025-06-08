#!/bin/bash

API_URL="http://localhost:4000/api/v1"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODNlMGI2ZDkzNGU5ZDZhMmMyMDA3OGYiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NDkzMzY5MDAsImV4cCI6MTc0OTQyMzMwMH0.rmmukDGIyLgxUuMUCRqLViq0e_F2JFvGSggfeLLahW0"
KITCHEN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODQ0Y2VhYTdiMTFiYTU3MDcxM2U5YWEiLCJlbWFpbCI6ImtpdGNoZW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoia2l0Y2hlbl9zdGFmZiIsImlhdCI6MTc0OTMzOTgxOCwiZXhwIjoxNzQ5NDI2MjE4fQ.w4OXBtbv1XowEYLDOC3V9VraJyEcxOvhh-SV3FU1YqA"
MENU_ITEM_ID="683e1fe3e90c61408fc4fe89"

echo "🎭 WebSocket Real-Time Event Demo"
echo "================================="
echo ""
echo "👀 Watch your WebSocket terminal for events!"
echo ""

# Create order
echo "1️⃣ Creating order..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "menuItemId": "'$MENU_ITEM_ID'",
      "quantity": 2
    }],
    "orderType": "pickup",
    "specialInstructions": "WebSocket demo order"
  }')

# Extract from data wrapper
ORDER_DATA=$(echo $ORDER_RESPONSE | grep -o '"data":{[^}]*' | sed 's/"data":{//')
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
ORDER_NUMBER=$(echo $ORDER_RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
  echo "✅ Order created: $ORDER_NUMBER"
  echo "   📢 WebSocket Event: 'order:created' sent to kitchen & customer"
  sleep 3
else
  echo "❌ Failed to create order"
  exit 1
fi

# Confirm order
echo -e "\n2️⃣ Confirming order..."
STATUS_RESPONSE=$(curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "notes": "Order received by kitchen"}')

if [[ $STATUS_RESPONSE == *"confirmed"* ]]; then
  echo "✅ Order confirmed by kitchen"
  echo "   📢 WebSocket Event: 'order:status_changed' (status: confirmed)"
  sleep 3
fi

# Start preparing
echo -e "\n3️⃣ Starting preparation..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing", "notes": "Chef is cooking your order"}' > /dev/null

echo "✅ Kitchen started preparing order"
echo "   📢 WebSocket Event: 'order:status_changed' (status: preparing)"
sleep 3

# Mark ready
echo -e "\n4️⃣ Marking order ready..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready", "notes": "Your order is ready for pickup!"}' > /dev/null

echo "✅ Order is ready for pickup!"
echo "   📢 WebSocket Events:"
echo "      - 'order:status_changed' (status: ready)"
echo "      - 'order:ready' (special notification to customer)"
sleep 3

# Create payment intent
echo -e "\n5️⃣ Creating payment intent..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payment/create-intent" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "'$ORDER_ID'"}')

PAYMENT_INTENT_ID=$(echo $PAYMENT_RESPONSE | grep -o '"paymentIntentId":"[^"]*' | cut -d'"' -f4)

if [ -n "$PAYMENT_INTENT_ID" ]; then
  echo "✅ Payment intent created: $PAYMENT_INTENT_ID"
  echo "   💳 Amount: $(echo $PAYMENT_RESPONSE | grep -o '"amount":[0-9]*' | cut -d':' -f2) cents"
  echo "   📢 When payment completes: 'payment:completed' event will fire"
else
  echo "⚠️  Payment response: $PAYMENT_RESPONSE"
fi

echo -e "\n📊 Summary"
echo "=========="
echo "Order: $ORDER_NUMBER"
echo "Status Flow: pending → confirmed → preparing → ready"
echo ""
echo "🎉 Demo complete! Check your WebSocket terminal for all the real-time events."