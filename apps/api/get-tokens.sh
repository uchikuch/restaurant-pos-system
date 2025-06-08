#!/bin/bash

# Get JWT tokens for WebSocket testing
API_URL="http://localhost:4000/api/v1"

echo "🔐 Getting JWT tokens for WebSocket testing..."
echo ""

# Login as customer (john@example.com)
echo "📧 Logging in as customer (john@example.com)..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$CUSTOMER_TOKEN" ]; then
  echo "✅ Customer token obtained"
  echo "CUSTOMER_TOKEN=\"$CUSTOMER_TOKEN\""
  echo ""
else
  echo "❌ Failed to get customer token"
  echo "Response: $CUSTOMER_RESPONSE"
  echo ""
fi

# Login as kitchen staff
echo "👨‍🍳 Logging in as kitchen staff (kitchen@restaurant.com)..."
KITCHEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kitchen@restaurant.com",
    "password": "password123"
  }')

KITCHEN_TOKEN=$(echo $KITCHEN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$KITCHEN_TOKEN" ]; then
  echo "✅ Kitchen staff token obtained"
  echo "KITCHEN_TOKEN=\"$KITCHEN_TOKEN\""
  echo ""
else
  echo "❌ Failed to get kitchen token"
  echo "Response: $KITCHEN_RESPONSE"
  echo ""
fi

# Login as admin
echo "👔 Logging in as admin (admin@restaurant.com)..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "password123"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
  echo "✅ Admin token obtained"
  echo "ADMIN_TOKEN=\"$ADMIN_TOKEN\""
  echo ""
else
  echo "❌ Failed to get admin token"
  echo "Response: $ADMIN_RESPONSE"
  echo ""
fi

# Get recent order ID (if customer token is available)
if [ -n "$CUSTOMER_TOKEN" ]; then
  echo "📦 Getting recent order ID..."
  ORDERS_RESPONSE=$(curl -s -X GET "$API_URL/orders/my-orders?limit=1" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN")
  
  ORDER_ID=$(echo $ORDERS_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -n "$ORDER_ID" ]; then
    echo "✅ Recent order found"
    echo "ORDER_ID=\"$ORDER_ID\""
    echo ""
  else
    echo "⚠️  No recent orders found"
    echo ""
  fi
fi

echo "📝 Instructions:"
echo "1. Copy the tokens above into your test-websocket.js file"
echo "2. Run: node test-websocket.js"
echo "3. In another terminal, create/update orders to see real-time events"