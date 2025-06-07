#!/bin/bash

# Complete Payment Flow Test
# Make sure:
# 1. Your API is running on port 4000
# 2. Stripe CLI is forwarding webhooks
# 3. MongoDB is running

set -e  # Exit on error

API_URL="http://localhost:4000/api/v1"
EMAIL="john@example.com"
PASSWORD="password123"

echo "🔐 Step 1: Login to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$EMAIL"'",
    "password": "'"$PASSWORD"'"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token. Check if user exists."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:30}..."

echo -e "\n🛒 Step 2: Check cart and add items if empty..."
CART_RESPONSE=$(curl -s -X GET "$API_URL/cart" \
  -H "Authorization: Bearer $TOKEN")

CART_ITEMS=$(echo $CART_RESPONSE | grep -o '"items":\[[^]]*\]' | grep -o '\[.*\]')

if [ "$CART_ITEMS" = "[]" ] || [ -z "$CART_ITEMS" ]; then
  echo "Cart is empty. Adding items..."
  
  # Get menu items
  MENU_RESPONSE=$(curl -s -X GET "$API_URL/menu-items/public?limit=2")
  
  # Extract first menu item ID
  MENU_ITEM_ID=$(echo $MENU_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  if [ -z "$MENU_ITEM_ID" ]; then
    echo "❌ No menu items found. Please seed your database first."
    exit 1
  fi
  
  echo "Adding menu item: $MENU_ITEM_ID"
  
  # Add to cart
  ADD_RESPONSE=$(curl -s -X POST "$API_URL/cart/items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "menuItemId": "'"$MENU_ITEM_ID"'",
      "quantity": 2
    }')
  
  echo "✅ Items added to cart"
else
  echo "✅ Cart already has items"
fi

echo -e "\n📦 Step 3: Checkout cart to create order..."
CHECKOUT_RESPONSE=$(curl -s -X POST "$API_URL/cart/checkout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "pickup",
    "specialInstructions": "Payment integration test"
  }')

ORDER_ID=$(echo $CHECKOUT_RESPONSE | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)
ORDER_NUMBER=$(echo $CHECKOUT_RESPONSE | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
  echo "❌ Failed to create order"
  echo "Response: $CHECKOUT_RESPONSE"
  exit 1
fi

echo "✅ Order created: $ORDER_NUMBER (ID: $ORDER_ID)"

echo -e "\n💳 Step 4: Create payment intent..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payment/create-intent" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "'"$ORDER_ID"'"
  }')

CLIENT_SECRET=$(echo $PAYMENT_RESPONSE | grep -o '"clientSecret":"[^"]*' | cut -d'"' -f4)
PAYMENT_INTENT_ID=$(echo $PAYMENT_RESPONSE | grep -o '"paymentIntentId":"[^"]*' | cut -d'"' -f4)
AMOUNT=$(echo $PAYMENT_RESPONSE | grep -o '"amount":[0-9]*' | cut -d':' -f2)

if [ -z "$PAYMENT_INTENT_ID" ]; then
  echo "❌ Failed to create payment intent"
  echo "Response: $PAYMENT_RESPONSE"
  exit 1
fi

echo "✅ Payment Intent created:"
echo "   ID: $PAYMENT_INTENT_ID"
echo "   Amount: \$$(echo "scale=2; $AMOUNT / 100" | bc)"
echo "   Client Secret: ${CLIENT_SECRET:0:40}..."

echo -e "\n💰 Step 5: Confirming payment with test card..."
# Using Stripe CLI to confirm payment with test card
stripe payment_intents confirm $PAYMENT_INTENT_ID \
  --payment-method=pm_card_visa \
  >/dev/null 2>&1

echo "✅ Payment confirmation sent"

echo -e "\n⏳ Step 6: Waiting for webhook processing..."
sleep 3

echo -e "\n🔍 Step 7: Checking order status..."
ORDER_STATUS_RESPONSE=$(curl -s -X GET "$API_URL/orders/my-orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")

ORDER_STATUS=$(echo $ORDER_STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
PAYMENT_STATUS=$(echo $ORDER_STATUS_RESPONSE | grep -o '"paymentStatus":"[^"]*' | cut -d'"' -f4)

echo -e "\n📊 Final Results:"
echo "================================"
echo "Order Number: $ORDER_NUMBER"
echo "Order Status: $ORDER_STATUS"
echo "Payment Status: $PAYMENT_STATUS"
echo "================================"

if [ "$PAYMENT_STATUS" = "completed" ]; then
  echo -e "\n✅ SUCCESS! Payment integration is working correctly!"
  echo "The order has been confirmed and is ready for preparation."
else
  echo -e "\n⚠️  Payment might still be processing. Check:"
  echo "1. Stripe CLI terminal for webhook events"
  echo "2. API server logs for any errors"
  echo "3. Try running this script again in a few seconds"
fi

echo -e "\n📝 Check your Stripe CLI terminal for webhook events!"
echo "You should see:"
echo "- payment_intent.created"
echo "- payment_intent.succeeded"
echo "- charge.succeeded"