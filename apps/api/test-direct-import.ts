import { 
  UserRole, 
  OrderStatus, 
  PaymentStatus 
} from '../../packages/shared-types/src';

console.log('Direct import test:');
console.log('User Role:', UserRole.CUSTOMER);
console.log('Order Status:', OrderStatus.PENDING);
console.log('Payment Status:', PaymentStatus.COMPLETED);
