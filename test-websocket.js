// test-websocket.js
// Place this file in your project root and run with: node test-websocket.js

const io = require("socket.io-client");

// Configuration
const API_URL = "http://localhost:4000";
const CUSTOMER_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODNlMGI2ZDkzNGU5ZDZhMmMyMDA3OGYiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NDkzMzY5MDAsImV4cCI6MTc0OTQyMzMwMH0.rmmukDGIyLgxUuMUCRqLViq0e_F2JFvGSggfeLLahW0";
const KITCHEN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODQ0Y2VhYTdiMTFiYTU3MDcxM2U5YWEiLCJlbWFpbCI6ImtpdGNoZW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoia2l0Y2hlbl9zdGFmZiIsImlhdCI6MTc0OTMzOTgxOCwiZXhwIjoxNzQ5NDI2MjE4fQ.w4OXBtbv1XowEYLDOC3V9VraJyEcxOvhh-SV3FU1YqA";

// Test customer connection
function testCustomerConnection() {
  console.log("\n🔵 Testing Customer WebSocket Connection...");

  const customerSocket = io(API_URL, {
    auth: {
      token: CUSTOMER_TOKEN,
    },
  });

  customerSocket.on("connect", () => {
    console.log("✅ Customer connected:", customerSocket.id);

    // Subscribe to a specific order
    const testOrderId = "YOUR_ORDER_ID"; // Replace with actual order ID
    customerSocket.emit("subscribe:order", testOrderId);
  });

  customerSocket.on("subscribed", (data) => {
    console.log("✅ Customer subscribed to:", data);
  });

  customerSocket.on("order:created", (data) => {
    console.log("📦 New order created:", data.orderNumber);
  });

  customerSocket.on("order:status_changed", (data) => {
    console.log("🔄 Order status changed:", data);
  });

  customerSocket.on("order:ready", (data) => {
    console.log("🍔 Order ready for pickup!", data);
  });

  customerSocket.on("payment:completed", (data) => {
    console.log("💰 Payment completed:", data);
  });

  customerSocket.on("payment:failed", (data) => {
    console.log("❌ Payment failed:", data);
  });

  customerSocket.on("disconnect", () => {
    console.log("❌ Customer disconnected");
  });

  customerSocket.on("error", (error) => {
    console.error("❌ Customer socket error:", error);
  });

  return customerSocket;
}

// Test kitchen connection
function testKitchenConnection() {
  console.log("\n🔴 Testing Kitchen WebSocket Connection...");

  const kitchenSocket = io(API_URL, {
    auth: {
      token: KITCHEN_TOKEN,
    },
  });

  kitchenSocket.on("connect", () => {
    console.log("✅ Kitchen connected:", kitchenSocket.id);

    // Subscribe to kitchen updates
    kitchenSocket.emit("subscribe:kitchen");
  });

  kitchenSocket.on("subscribed", (data) => {
    console.log("✅ Kitchen subscribed to:", data);
  });

  kitchenSocket.on("order:created", (data) => {
    console.log("🆕 New order in kitchen:", {
      orderNumber: data.orderNumber,
      items: data.items.map((i) => `${i.quantity}x ${i.name}`),
      type: data.orderType,
      estimatedTime: `${data.estimatedPrepTime} mins`,
    });
  });

  kitchenSocket.on("order:status_changed", (data) => {
    console.log("📝 Kitchen order update:", {
      orderNumber: data.orderNumber,
      status: data.status,
    });
  });

  kitchenSocket.on("payment:completed", (data) => {
    console.log("✅ Payment confirmed for order:", data.orderNumber);
  });

  kitchenSocket.on("disconnect", () => {
    console.log("❌ Kitchen disconnected");
  });

  kitchenSocket.on("error", (error) => {
    console.error("❌ Kitchen socket error:", error);
  });

  return kitchenSocket;
}

// Test anonymous connection (no auth)
function testAnonymousConnection() {
  console.log("\n⚪ Testing Anonymous WebSocket Connection...");

  const anonSocket = io(API_URL);

  anonSocket.on("connect", () => {
    console.log("✅ Anonymous connected:", anonSocket.id);
    console.log("⚠️  Note: Anonymous connections have limited functionality");
  });

  anonSocket.on("disconnect", () => {
    console.log("❌ Anonymous disconnected");
  });

  return anonSocket;
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting WebSocket Tests...");
  console.log("📍 Connecting to:", API_URL);

  // Start all connections
  const customerSocket = testCustomerConnection();
  const kitchenSocket = testKitchenConnection();
  const anonSocket = testAnonymousConnection();

  // Keep the script running
  console.log("\n⏳ Listening for events... Press Ctrl+C to exit\n");
}

// Instructions
console.log(`
📋 WebSocket Test Instructions:
1. Make sure your API is running (pnpm dev:api)
2. Update the JWT tokens in this script:
   - CUSTOMER_TOKEN: Get from login as john@example.com
   - KITCHEN_TOKEN: Get from login as kitchen staff
3. Optionally update the ORDER_ID for testing specific order subscriptions
4. Run: npm install socket.io-client (if not already installed)
5. Run: node test-websocket.js

🔧 To trigger events:
- Create a new order via API
- Update order status via API
- Process a payment via Stripe
`);

// Run the tests
runTests();
