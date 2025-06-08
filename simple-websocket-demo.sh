#!/bin/bash

API_URL="http://localhost:4000/api/v1"
CUSTOMER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODNlMGI2ZDkzNGU5ZDZhMmMyMDA3OGYiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NDkzMzY5MDAsImV4cCI6MTc0OTQyMzMwMH0.rmmukDGIyLgxUuMUCRqLViq0e_F2JFvGSggfeLLahW0"
KITCHEN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODQ0Y2VhYTdiMTFiYTU3MDcxM2U5YWEiLCJlbWFpbCI6ImtpdGNoZW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoia2l0Y2hlbl9zdGFmZiIsImlhdCI6MTc0OTMzOTgxOCwiZXhwIjoxNzQ5NDI2MjE4fQ.w4OXBtbv1XowEYLDOC3V9VraJyEcxOvhh-SV3FU1YqA"

echo "🚀 Simple WebSocket Demo"
echo "======================="
echo ""

# Use the Margherita Pizza which we know exists and is available
MENU_ITEM_ID="683e1fe3e90c61408fc4fe89"

echo "📦 Creating order with Margherita Pizza..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "menuItemId": "'$MENU_ITEM_ID'",
        "quantity": 1
      }
    ],
    "orderType": "pickup"
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
ORDER_NUMBER=$(echo $ORDER_RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
  echo "✅ Order created: $ORDER_NUMBER"
  echo ""
  echo "👀 Check your WebSocket terminal for events!"
  
  sleep 2
  
  echo "🔄 Updating order status..."
  curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $KITCHEN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "confirmed"}' > /dev/null
  
  echo "✅ Order confirmed!"
else
  echo "❌ Failed to create order"
  echo "$ORDER_RESPONSE"
fi
