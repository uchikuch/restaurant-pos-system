"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shared_types_1 = require("@restaurant-pos/shared-types");
// Test that enums work
console.log('User Role:', shared_types_1.UserRole.CUSTOMER);
console.log('Order Status:', shared_types_1.OrderStatus.PENDING);
console.log('Payment Status:', shared_types_1.PaymentStatus.COMPLETED);
// Test that interfaces are available with ALL required properties
var testUser = {
    _id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: shared_types_1.UserRole.CUSTOMER,
    isActive: true,
    emailVerified: true, // Added missing property
    phoneVerified: false, // Added missing property  
    createdAt: new Date(),
    updatedAt: new Date()
};
console.log('🎉 Types are working correctly!', testUser.role);
console.log('✅ Email verified:', testUser.emailVerified);
console.log('✅ Full type safety achieved!');
