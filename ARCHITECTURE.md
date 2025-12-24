# Seed to Sale - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                      Port: 5173 (Development)                    │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │   Dashboard  │    Plants    │  Sales/POS   │     Users    │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
│                              │                                   │
│                       API Service Layer                          │
│                       (axios + interceptors)                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │ JWT Authentication
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Backend API (NestJS)                          │
│                      Port: 3000                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Controllers                        │  │
│  │  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────────┐ │  │
│  │  │ Auth │ User │Cultiv│Sales │ POS  │ Room │Inventory │ │  │
│  │  └──────┴──────┴──────┴──────┴──────┴──────┴──────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Business Services                      │  │
│  │  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────────┐ │  │
│  │  │Auth  │User  │Cultiv│Sales │Audit │Room  │Inventory │ │  │
│  │  │Svc   │Svc   │Svc   │Svc   │Svc   │Svc   │Type Svc  │ │  │
│  │  └──────┴──────┴──────┴──────┴──────┴──────┴──────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer                       │  │
│  │  ┌──────────┬──────────────┬──────────────────────────┐ │  │
│  │  │ JWT Auth │ Role Guards  │ Location Module Guards   │ │  │
│  │  └──────────┴──────────────┴──────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Prisma ORM (Data Access Layer)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ SQL Queries
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    PostgreSQL Database                           │
│                         Port: 5432                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Database Tables                      │  │
│  │  • User, Role, UserPermission                            │  │
│  │  • Location, Room                                        │  │
│  │  • Plant, Harvest, Cure, Destruction                     │  │
│  │  • InventoryItem, InventoryType                          │  │
│  │  • Sale, SaleItem, Customer, Refund                      │  │
│  │  • Transfer, TransferItem                                │  │
│  │  • Conversion, ConversionInput, ConversionOutput         │  │
│  │  • AuditLog, Test, TestingPanel                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                          AppModule                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  AuthModule ──────────────► PrismaService                │  │
│  │     │                           ▲                        │  │
│  │     └─► JwtModule                │                        │  │
│  │         JwtStrategy               │                        │  │
│  │         Guards & Decorators       │                        │  │
│  │                                   │                        │  │
│  │  UserModule ──────────────────────┤                        │  │
│  │     └─► UserService               │                        │  │
│  │         RolesController           │                        │  │
│  │                                   │                        │  │
│  │  CultivationModule ───────────────┤                        │  │
│  │     ├─► CultivationService        │                        │  │
│  │     ├─► HarvestService            │                        │  │
│  │     ├─► CureService               │                        │  │
│  │     ├─► RoomService               │                        │  │
│  │     └─► DestructionService        │                        │  │
│  │                                   │                        │  │
│  │  SalesModule ──────────────────────┤                        │  │
│  │     └─► SalesService              │                        │  │
│  │         (Customer, Sale,          │                        │  │
│  │          Refund management)       │                        │  │
│  │                                   │                        │  │
│  │  LicenseeModule ───────────────────┤                        │  │
│  │                                   │                        │  │
│  │  InventoryTypeModule ──────────────┘                        │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
1. User Login Request
   ↓
2. POST /auth/login (email, password, ubi)
   ↓
3. Validate credentials against database
   ↓
4. Return allowed interfaces (licensee, state, admin)
   ↓
5. User selects interface
   ↓
6. POST /auth/select-interface (userId, interfaceSelection, ubi)
   ↓
7. Validate interface permission
   ↓
8. Generate JWT token with user info + interface + ubi
   ↓
9. Return JWT token to frontend
   ↓
10. Store token in localStorage
    ↓
11. Include token in all subsequent API requests
    ↓
12. JwtAuthGuard validates token
    ↓
13. RolesGuard validates user role
    ↓
14. LocationModuleGuard validates location permission
    ↓
15. Request proceeds to controller
```

## Data Flow Example: Creating a Sale

```
Frontend (React)                    Backend (NestJS)                Database
    │                                    │                            │
    │  1. User clicks "Complete Sale"    │                            │
    ├───────────────────────────────────►│                            │
    │  POST /sales/:locationId/sales     │                            │
    │  Body: { items: [...] }            │                            │
    │  Header: Authorization: Bearer JWT │                            │
    │                                    │                            │
    │                                    │  2. JwtAuthGuard validates │
    │                                    │     token                  │
    │                                    │                            │
    │                                    │  3. RolesGuard checks role │
    │                                    │                            │
    │                                    │  4. LocationModuleGuard    │
    │                                    │     checks permissions     │
    │                                    │                            │
    │                                    │  5. SalesController        │
    │                                    │     receives request       │
    │                                    │     ↓                      │
    │                                    │  6. SalesService.createSale│
    │                                    ├───────────────────────────►│
    │                                    │     Validate inventory     │
    │                                    │     ◄──────────────────────┤
    │                                    │                            │
    │                                    │  7. Begin transaction      │
    │                                    ├───────────────────────────►│
    │                                    │     Create Sale record     │
    │                                    │     ◄──────────────────────┤
    │                                    ├───────────────────────────►│
    │                                    │     Create SaleItems       │
    │                                    │     ◄──────────────────────┤
    │                                    ├───────────────────────────►│
    │                                    │     Update inventory qty   │
    │                                    │     ◄──────────────────────┤
    │                                    │  8. Commit transaction     │
    │                                    │                            │
    │  9. Return sale data               │                            │
    │◄───────────────────────────────────┤                            │
    │  { id, totalAmount, items... }     │                            │
    │                                    │                            │
    │  10. Update UI with success        │                            │
```

## Key Technologies

- **Frontend**: React 18, React Router, Axios, Vite
- **Backend**: NestJS, TypeScript, Passport JWT
- **Database**: PostgreSQL with Prisma ORM
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Security**: bcrypt, JWT, RBAC
- **Development**: Docker, Docker Compose

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Authentication (JwtAuthGuard)                          │
│  └─► Validates JWT token is present and valid                   │
│      Extracts user info from token                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Role-Based Access Control (RolesGuard)                │
│  └─► Validates user has required role (licensee_admin, etc.)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Location & Module Permissions (LocationModuleGuard)   │
│  └─► Validates user has access to location                      │
│      Validates user has permission for module (cultivation, etc)│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Input Validation (ValidationPipe)                     │
│  └─► Validates request body against DTOs                        │
│      Strips unknown properties                                  │
│      Transforms data types                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: Business Logic Validation (Services)                  │
│  └─► Validates business rules                                   │
│      Checks resource existence                                  │
│      Validates relationships                                    │
└─────────────────────────────────────────────────────────────────┘
```
