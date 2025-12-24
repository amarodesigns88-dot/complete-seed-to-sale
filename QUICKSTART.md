# 🚀 Quick Start Guide - Seed to Sale

Get the Seed to Sale Cannabis Tracking System running in 5 minutes!

## Prerequisites

- Node.js v18+
- PostgreSQL 12+
- npm or pnpm

## Option 1: Automated Setup (Recommended)

### 1. Run the setup script
```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- Install all dependencies (backend & frontend)
- Generate Prisma client
- Create .env file from template
- Run database migrations
- Build the backend

### 2. Update database credentials

Edit `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/seed_to_sale"
JWT_SECRET="your-secret-key-change-this"
```

### 3. Start the application

Terminal 1 - Backend:
```bash
npm run start:dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### 4. Access the application

- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api-docs
- Backend: http://localhost:3000

---

## Option 2: Docker Setup (Easiest)

### 1. Start everything with Docker Compose
```bash
docker-compose up
```

This will start:
- PostgreSQL database
- Backend API
- Frontend application

### 2. Access the application

- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api-docs
- Backend: http://localhost:3000

---

## Option 3: Manual Setup

### 1. Install backend dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run database migrations
```bash
npx prisma migrate dev
```

### 5. (Optional) Seed database
```bash
npm run seed
```

### 6. Build backend
```bash
npm run build
```

### 7. Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### 8. Start backend
```bash
npm run start:dev
```

### 9. In a new terminal, start frontend
```bash
cd frontend
npm run dev
```

---

## Default Login (After Seeding)

If you ran the seed script, use these credentials:

- Email: `admin@example.com`
- Password: `admin123`

---

## Common Issues

### Database Connection Error
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `createdb seed_to_sale`

### Port Already in Use
Backend (3000):
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

Frontend (5173):
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Migration Errors
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually run migrations
npx prisma migrate dev
```

---

## Next Steps

1. **Explore the API**: Visit http://localhost:3000/api-docs
2. **Check the Frontend**: Open http://localhost:5173
3. **Review Documentation**: See README_FULL.md for detailed docs
4. **Customize**: Start modifying code in `src/` and `frontend/src/`

---

## Available Scripts

### Backend
```bash
npm run start:dev    # Start in development mode
npm run start:prod   # Start in production mode
npm run build        # Build the application
npm test             # Run tests
npm run lint         # Lint code
npm run seed         # Seed database
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## File Structure Quick Reference

```
complete-seed-to-sale/
├── src/                    # Backend source
│   ├── auth/              # Authentication
│   ├── cultivation/       # Plant management
│   ├── sales/             # Sales & POS
│   ├── user/              # User management
│   └── prisma/            # Database
├── frontend/              # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable components
│       └── services/      # API services
├── .env                   # Environment variables
└── docker-compose.yml     # Docker setup
```

---

## Need Help?

- 📖 Full documentation: `README_FULL.md`
- 🐛 Issues: Open a GitHub issue
- 💬 API Docs: http://localhost:3000/api-docs

---

Happy tracking! 🌱
