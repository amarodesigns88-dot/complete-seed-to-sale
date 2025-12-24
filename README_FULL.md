# Seed to Sale - Cannabis Tracking System

A complete full-stack application for tracking cannabis cultivation, inventory, and sales from seed to final sale. Built with NestJS (backend) and React (frontend).

## 🌟 Features

### Backend API (NestJS)
- **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **Cultivation Module**: Plant tracking, harvest management, cure records, room management
- **Sales & POS Module**: Point of sale, customer management, refunds, sales history
- **Inventory Management**: Track inventory items, conversions, and transfers
- **User Management**: Multi-user support with permissions
- **Audit Logging**: Track all critical operations
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

### Frontend UI (React)
- **Dashboard**: Overview of key metrics and stats
- **Plant Management**: Create, view, and manage plants throughout their lifecycle
- **Sales & POS**: Point-of-sale interface for processing sales
- **Customer Management**: Track customer information
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or pnpm

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd complete-seed-to-sale
```

### 2. Setup Backend

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env and configure your database connection
# DATABASE_URL="postgresql://user:password@localhost:5432/seed_to_sale"
# JWT_SECRET="your-secret-key"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Optional: Seed the database with sample data
npm run seed

# Build the backend
npm run build

# Start the backend server
npm run start:dev
```

The backend API will be available at `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api-docs`

### 3. Setup Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📚 API Documentation

Once the backend is running, visit `http://localhost:3000/api-docs` to explore the complete API documentation with Swagger UI.

### Main API Endpoints

#### Authentication
- `POST /auth/login` - Login with credentials
- `POST /auth/select-interface` - Select interface and get JWT token

#### Cultivation
- `GET /cultivation/:locationId/plants` - List all plants
- `POST /cultivation/:locationId/plants` - Create a new plant
- `GET /cultivation/:locationId/rooms` - List all rooms
- `POST /cultivation/:locationId/plants/:plantId/harvest` - Harvest a plant

#### Sales & POS
- `GET /sales/:locationId/sales` - Get sales history
- `POST /sales/:locationId/sales` - Create a new sale
- `GET /sales/:locationId/customers` - List customers
- `POST /sales/:locationId/customers` - Create a customer
- `GET /sales/:locationId/available-inventory` - Get available inventory

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **User**: System users with roles and permissions
- **Location**: Physical locations/facilities
- **Plant**: Individual plants being tracked
- **Room**: Cultivation rooms
- **Harvest**: Harvest records from plants
- **InventoryItem**: Inventory items (products)
- **Sale**: Sales transactions
- **Customer**: Customer records

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

## 🏗️ Project Structure

```
complete-seed-to-sale/
├── src/                          # Backend source code
│   ├── auth/                     # Authentication module
│   ├── cultivation/              # Cultivation management
│   ├── sales/                    # Sales & POS module
│   ├── user/                     # User management
│   ├── prisma/                   # Database schema & migrations
│   │   └── schema.prisma         # Prisma schema definition
│   ├── main.ts                   # Application entry point
│   └── app.module.ts             # Root module
├── frontend/                     # Frontend React application
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API service layer
│   │   └── styles/               # CSS styles
│   ├── index.html                # HTML template
│   └── vite.config.js            # Vite configuration
├── docs/                         # API documentation
├── test/                         # Test files
├── .env                          # Environment variables
├── package.json                  # Backend dependencies
└── README.md                     # This file
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Location-based module permissions
- Input validation with class-validator
- SQL injection prevention with Prisma

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/seed_to_sale?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION="24h"

# Application
NODE_ENV="development"
PORT=3000

# Admin User (for seeding)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

## 📦 Deployment

### Backend Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables for production

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the application:
   ```bash
   npm run start:prod
   ```

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `dist/` directory to your hosting service (Vercel, Netlify, etc.)

3. Configure the API proxy or update the `baseURL` in `frontend/src/services/api.js`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED license.

## 🆘 Support

For issues and questions:
- Check the [API Documentation](http://localhost:3000/api-docs)
- Review the database schema in `src/prisma/schema.prisma`
- Open an issue on the repository

## 🎯 Roadmap

- [ ] Complete unit and integration tests
- [ ] Add inventory transfer tracking
- [ ] Implement conversion tracking
- [ ] Add testing/lab results module
- [ ] Enhance reporting and analytics
- [ ] Mobile application
- [ ] Real-time notifications
- [ ] Export compliance reports

## 🏆 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [Prisma](https://www.prisma.io/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Vite](https://vitejs.dev/) - Frontend build tool
