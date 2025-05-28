// MongoDB initialization script
db = db.getSiblingDB("restaurant-pos");

// Create application user
db.createUser({
  user: "restaurant_user",
  pwd: "restaurant_pass",
  roles: [{ role: "readWrite", db: "restaurant-pos" }],
});

// Create collections
db.createCollection("users");
db.createCollection("categories");
db.createCollection("menu-items");
db.createCollection("orders");
db.createCollection("payments");
db.createCollection("loyalty-accounts");

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 });
db.users.createIndex({ role: 1 });

db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });

db["menu-items"].createIndex({ categoryId: 1 });
db["menu-items"].createIndex({ isAvailable: 1 });
db["menu-items"].createIndex({ name: "text", description: "text" });

db.categories.createIndex({ sortOrder: 1 });
db.categories.createIndex({ isActive: 1 });

db.payments.createIndex({ orderId: 1 });
db.payments.createIndex({ stripePaymentIntentId: 1 }, { unique: true });

db["loyalty-accounts"].createIndex({ userId: 1 }, { unique: true });

print("✅ Database initialized successfully with collections and indexes");
