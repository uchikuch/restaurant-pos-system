#!/bin/bash

# WebSocket Real-time Demo Script
# This script demonstrates the full WebSocket flow

API_URL="http://localhost:4000/api/v1"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODNlMGI2ZDkzNGU5ZDZhMmMyMDA3OGYiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NDkzMzY5MDAsImV4cCI6MTc0OTQyMzMwMH0.rmmukDGIyLgxUuMUCRqLViq0e_F2JFvGSggfeLLahW0"
KITCHEN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODQ0Y2VhYTdiMTFiYTU3MDcxM2U5YWEiLCJlbWFpbCI6ImtpdGNoZW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoia2l0Y2hlbl9zdGFmZiIsImlhdCI6MTc0OTMzOTgxOCwiZXhwIjoxNzQ5NDI2MjE4fQ.w4OXBtbv1XowEYLDOC3V9VraJyEcxOvhh-SV3FU1YqA"

echo "🚀 WebSocket Real-time Demo"
echo "=========================="
echo ""
echo "⚠️  Make sure you have 'node test-websocket.js' running in another terminal!"
echo ""
echo "Press Enter to start the demo..."
read

# Step 1: Get a valid menu item first
echo "🔍 Getting available menu items..."
MENU_RESPONSE=$(curl -s -X GET "$API_URL/menu-items/public?limit=1")
MENU_ITEM_ID=$(echo $MENU_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$MENU_ITEM_ID" ]; then
  echo "❌ No menu items found. Please seed your database first."
  exit 1
fi

echo "✅ Found menu item: $MENU_ITEM_ID"
echo ""

# Step 2: Create a new order
echo "📦 Step 2: Creating a new order..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "menuItemId": "'"$MENU_ITEM_ID"'",
        "quantity": 2,
        "specialInstructions": "Extra hot sauce"
      }
    ],
    "orderType": "pickup",
    "specialInstructions": "WebSocket test order"
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
ORDER_NUMBER=$(echo $ORDER_RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
  echo "✅ Order created successfully!"
  echo "   Order ID: $ORDER_ID"
  echo "   Order Number: $ORDER_NUMBER"
  echo ""
  echo "👀 Check your WebSocket terminal - you should see:"
  echo "   - Customer: order:created event"
  echo "   - Kitchen: order:created event"
  echo ""
else
  echo "❌ Failed to create order"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

sleep 3

# Step 3: Update order status to CONFIRMED
echo "🔄 Step 3: Confirming the order (as kitchen staff)..."
STATUS_RESPONSE=$(curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Order confirmed by kitchen"
  }')

if [[ $STATUS_RESPONSE == *"confirmed"* ]]; then
  echo "✅ Order confirmed!"
  echo ""
  echo "👀 Check your WebSocket terminal - you should see:"
  echo "   - order:status_changed events"
  echo ""
else
  echo "❌ Failed to confirm order"
  echo "Response: $STATUS_RESPONSE"
fi

sleep 3

# Step 4: Update to PREPARING
echo "👨‍🍳 Step 4: Starting preparation..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "preparing",
    "notes": "Started cooking"
  }' > /dev/null

echo "✅ Order is being prepared!"
echo ""

sleep 3

# Step 5: Mark as READY
echo "🍔 Step 5: Order ready for pickup..."
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $KITCHEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ready",
    "notes": "Ready for pickup"
  }' > /dev/null

echo "✅ Order is ready!"
echo ""
echo "👀 Check your WebSocket terminal - you should see:"
echo "   - order:ready notification"
echo "   - Special alert to customer"
echo ""

sleep 3

# Step 6: Create payment intent
echo "💳 Step 6: Creating payment intent..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payment/create-intent" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

CLIENT_SECRET=$(echo $PAYMENT_RESPONSE | grep -o '"clientSecret":"[^"]*' | cut -d'"' -f4)

if [ -n "$CLIENT_SECRET" ]; then
  echo "✅ Payment intent created!"
  echo ""
  echo "ℹ️  In a real app, the frontend would now:"
  echo "   1. Use Stripe.js to collect payment"
  echo "   2. Confirm the payment"
  echo "   3. WebSocket would notify: payment:completed"
else
  echo "❌ Failed to create payment intent"
  echo "Response: $PAYMENT_RESPONSE"
fi

echo ""
echo "🎉 Demo Complete!"
echo ""
echo "Summary of WebSocket events that were triggered:"
echo "1. order:created - Sent to customer, kitchen, and admins"
echo "2. order:status_changed - Sent when status updated"
echo "3. order:ready - Special notification when food is ready"
echo "4. payment:completed - Would be sent after successful payment"
echo ""
echo "💡 Try updating the order status to 'completed' to see more events!"