#!/bin/bash

# Database Reset Script for Complete Seed-to-Sale Application
# This script drops all tables and rebuilds the database from schema

set -e  # Exit on error

echo "🗑️  Database Reset Script"
echo "================================"
echo ""
echo "⚠️  WARNING: This will DROP ALL TABLES in the database!"
echo "⚠️  All data will be PERMANENTLY DELETED!"
echo ""

# Check if running in CI or with --force flag
if [ "$CI" != "true" ] && [ "$1" != "--force" ]; then
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Database reset cancelled"
        exit 0
    fi
fi

echo ""
echo "📋 Step 1: Dropping all tables..."

# Drop all tables using Prisma
npx prisma migrate reset --force --schema=src/prisma/schema.prisma

echo "✅ All tables dropped successfully"
echo ""
echo "📋 Step 2: Running migrations to rebuild database..."

# Run all migrations
npx prisma migrate deploy --schema=src/prisma/schema.prisma

echo "✅ Migrations applied successfully"
echo ""
echo "📋 Step 3: Generating Prisma Client..."

# Generate Prisma Client
npx prisma generate --schema=src/prisma/schema.prisma

echo "✅ Prisma Client generated successfully"
echo ""
echo "🎉 Database reset complete!"
echo ""
echo "Next steps:"
echo "  - Run 'npm run seed' to populate with initial data (if seed script exists)"
echo "  - Run 'npm run start:dev' to start the application"
