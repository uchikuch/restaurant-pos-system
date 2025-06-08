#!/bin/bash

API_URL="http://localhost:4000/api/v1"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODNlMGI2ZDkzNGU5ZDZhMmMyMDA3OGYiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NDkzMzY5MDAsImV4cCI6MTc0OTQyMzMwMH0.rmmukDGIyLgxUuMUCRqLViq0e_F2JFvGSggfeLLahW0"
KITCHEN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODQ0Y2VhYTdiMTFiYTU3MDcxM2U5YWEiLCJlbWFpbCI6ImtpdGNoZW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoia2l0Y2hlbl9zdGFmZiIsImlhdCI6MTc0OTMzOTgxOCwiZXhwIjoxNzQ5NDI2MjE4fQ.w4OXBtbv1XowEYLDOC3V9VraJyEcxOvhh-SV3FU1YqA"
MENU_ITEM_ID="683e1fe3e90c61408fc4fe89"

echo "🎭 Full WebSocket Event Demo"
echo "============================"
echo ""

# Create order
echo "1️⃣ Creating order..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "menuItemId": "'$MENU_ITEM_ID'",
      "quantity": 2,
      "customizations": [{
        "customizationId": "size",
        "selectedOptions": [{
          "optionId": "large"
        }]
      }]
    }],
    "orderType": "pickup",
    "specialInstructions": "Full WebSocket demo"
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
ORDER_NUMBER=$(echo $ORDER_RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)

echo "✅ Order $ORDER_NUMBER created"
echo "   💡 Event: order:created sent to customer, kitchen, admins"
sleep 2

# Confirm order
echo -e "\n2️⃣ Confirming order..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "notes": "Order received"}' > /dev/null
echo "✅ Order confirmed"
echo "   💡 Event: order:status_changed"
sleep 2

# Start preparing
echo -e "\n3️⃣ Starting preparation..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing", "notes": "Cooking in progress"}' > /dev/null
echo "✅ Preparation started"
echo "   💡 Event: order:status_changed sent to kitchen"
sleep 2

# Mark ready
echo -e "\n4️⃣ Order ready for pickup..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready", "notes": "Ready at counter"}' > /dev/null
echo "✅ Order ready!"
echo "   💡 Events: order:status_changed + order:ready (special notification)"
sleep 2

# Create payment
echo -e "\n5️⃣ Processing payment..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payment/create-intent" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "'$ORDER_ID'"}')

PAYMENT_INTENT_ID=$(echo $PAYMENT_RESPONSE | grep -o '"paymentIntentId":"[^"]*' | cut -d'"' -f4)
echo "✅ Payment intent created: ${PAYMENT_INTENT_ID:0:20}..."
echo "   💡 When payment completes: payment:completed event"

echo -e "\n📊 Summary of WebSocket Events:"
echo "================================"
echo "✓ order:created - New order notification"
echo "✓ order:status_changed - Status updates"
echo "✓ order:ready - Special ready notification"
echo "✓ payment:completed - Payment confirmation"
echo ""
echo "Check your WebSocket terminal to see all these events!"
