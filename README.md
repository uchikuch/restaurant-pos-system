# 🍽️ Restaurant POS & Ordering System

A modern, full-stack restaurant management system built with Next.js, NestJS, and MongoDB. This comprehensive solution includes customer ordering, kitchen management, and administrative capabilities with real-time updates and secure payment processing.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)

## 🎯 Project Overview

This Restaurant POS System demonstrates full-stack development capabilities with modern web technologies. Built as both a portfolio showcase and a practical client template, it features a complete restaurant management ecosystem.

### 🌟 Key Features

- **🛒 Customer Ordering System** - Modern e-commerce experience for food ordering
- **👨‍🍳 Kitchen Management Dashboard** - Real-time order management for staff
- **📊 Admin Panel** - Comprehensive restaurant management interface
- **💳 Secure Payments** - Stripe integration for payment processing
- **🔄 Real-time Updates** - WebSocket connections for live order status
- **🎁 Loyalty Program** - Customer rewards and points system
- **📱 Mobile-First Design** - Responsive across all devices
- **🔐 Role-Based Access** - Secure authentication with JWT

## 🏗️ Architecture

### Monorepo Structure
```
restaurant-pos-system/
├── apps/
│   ├── customer-web/        # Customer ordering interface
│   ├── kitchen-dashboard/   # Kitchen staff dashboard  
│   ├── admin-panel/         # Administrative interface
│   └── api/                 # NestJS backend API
├── packages/
│   ├── shared-types/        # Common TypeScript types
│   └── ui-components/       # Shared React components
└── tools/                   # Development utilities
```

### Technology Stack

**Frontend Applications**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Zustand for state management
- Socket.io for real-time features

**Backend API**
- NestJS framework
- MongoDB with Mongoose ODM
- JWT authentication
- Stripe payment integration
- WebSocket support

**Development & Deployment**
- PNPM workspaces for monorepo management
- Docker for development environment
- ESLint + Prettier for code quality
- Jest for testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PNPM 8+
- Docker and Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/uchikuch/restaurant-pos-system.git
   cd restaurant-pos-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development databases**
   ```bash
   docker-compose up -d
   ```

5. **Start all applications**
   ```bash
   pnpm dev
   ```

### Access the Applications

- **Customer Web**: http://localhost:3000
- **Kitchen Dashboard**: http://localhost:3001  
- **Admin Panel**: http://localhost:3002
- **API Server**: http://localhost:3003

## 🎨 User Interfaces

### Customer Experience
- Browse menu with categories and search
- Add items to cart with customizations
- Secure checkout with Stripe
- Real-time order tracking
- Loyalty points and rewards

### Kitchen Dashboard
- View incoming orders in real-time
- Update order status and preparation times
- Kitchen-optimized interface for tablets
- Order history and analytics

### Admin Panel
- Menu management (items, categories, pricing)
- Order monitoring and management
- Customer analytics and insights
- Staff management and permissions
- Revenue reporting and analytics

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all applications
pnpm dev:customer     # Customer app only
pnpm dev:kitchen      # Kitchen dashboard only  
pnpm dev:admin        # Admin panel only
pnpm dev:api          # API server only

# Building
pnpm build            # Build all applications
pnpm build:customer   # Build customer app
pnpm build:api        # Build API server

# Testing
pnpm test             # Run all tests
pnpm test:e2e         # End-to-end tests

# Database
pnpm db:seed          # Seed database with sample data
```

### Project Structure Deep Dive

Each application follows clean architecture principles:

- **`/src/app`** - Next.js App Router pages
- **`/src/components`** - React components organized by feature
- **`/src/hooks`** - Custom React hooks
- **`/src/lib`** - Utilities and configurations
- **`/src/store`** - State management with Zustand
- **`/src/types`** - TypeScript type definitions

## 🔐 Authentication & Security

- JWT-based authentication with refresh tokens
- Role-based access control (Customer, Kitchen Staff, Admin)
- Secure payment processing with Stripe
- Input validation and sanitization
- Rate limiting and CORS protection

## 🎯 Portfolio Showcase

This project demonstrates proficiency in:

- **Full-Stack Development** - Complete system from database to UI
- **Modern React Patterns** - Hooks, state management, component architecture
- **TypeScript** - Type-safe development across frontend and backend
- **API Design** - RESTful APIs with NestJS and proper documentation
- **Database Design** - MongoDB schema design and optimization
- **Real-time Features** - WebSocket implementation for live updates
- **Payment Integration** - Stripe payment processing
- **Monorepo Management** - PNPM workspaces and shared packages
- **DevOps** - Docker containerization and CI/CD ready

## 🚀 Deployment

### Production Build
```bash
# Build all applications
pnpm build

# Build Docker images
docker build -f Dockerfile.api -t restaurant-pos-api .
docker build -f Dockerfile.frontend -t restaurant-pos-customer .
```

### Environment Variables

Key environment variables for production:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/restaurant-pos
REDIS_URL=redis://localhost:6379

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application URLs
CUSTOMER_APP_URL=https://your-customer-app.com
API_URL=https://your-api-server.com
```

## 🤝 Client Customization

This system is designed as a template for restaurant clients:

- **Easy Branding** - Tailwind CSS variables for colors and styling
- **Configurable Features** - Enable/disable features per client needs
- **Multi-tenant Ready** - Architecture supports multiple restaurant brands
- **White-label Solution** - Complete customization capabilities

## 📈 Roadmap

- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Mobile app with React Native
- [ ] Integration with delivery platforms
- [ ] Inventory management system
- [ ] Staff scheduling module

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests  
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@uchikuch](https://github.com/uchikuch)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Portfolio: [Your Portfolio](https://yourportfolio.com)

---

⭐ **Star this repository if you find it helpful!**

Built with ❤️ for restaurants and developers