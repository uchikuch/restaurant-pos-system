import { 
  UserRole, 
  OrderStatus, 
  PaymentStatus,
  User,
  MenuItem,
  Order 
} from '@restaurant-pos/shared-types';

// Test that enums work
console.log('User Role:', UserRole.CUSTOMER);
console.log('Order Status:', OrderStatus.PENDING);
console.log('Payment Status:', PaymentStatus.COMPLETED);

// Test that interfaces are available with ALL required properties
const testUser: User = {
  _id: '123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.CUSTOMER,
  isActive: true,
  emailVerified: true,  // Added missing property
  phoneVerified: false, // Added missing property  
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('🎉 Types are working correctly!', testUser.role);
console.log('✅ Email verified:', testUser.emailVerified);
console.log('✅ Full type safety achieved!');
