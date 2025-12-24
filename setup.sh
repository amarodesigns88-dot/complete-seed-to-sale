#!/bin/bash

# Seed to Sale - Setup Script
echo "🌱 Setting up Seed to Sale Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm $(npm --version) found"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials before proceeding!"
    echo "   Especially update DATABASE_URL and JWT_SECRET"
    read -p "Press enter when you've updated .env file..."
fi

# Generate Prisma Client
echo ""
echo "🔨 Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
echo "⚠️  Make sure your PostgreSQL database is running!"
read -p "Press enter to run migrations (or Ctrl+C to cancel)..."

npx prisma migrate dev

if [ $? -ne 0 ]; then
    echo "⚠️  Migration failed. Make sure your database is running and .env is configured correctly."
    echo "   You can run 'npx prisma migrate dev' manually later."
fi

# Build backend
echo ""
echo "🔨 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build backend"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Make sure PostgreSQL is running"
echo "   2. Update .env with your database credentials if you haven't already"
echo "   3. Run 'npx prisma migrate dev' if migrations failed"
echo "   4. Optionally run 'npm run seed' to add sample data"
echo ""
echo "🚀 To start the application:"
echo "   Backend:  npm run start:dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "   Then visit:"
echo "   - Frontend: http://localhost:5173"
echo "   - API Docs: http://localhost:3000/api-docs"
echo ""
