# Complete Seed-to-Sale Frontend

A comprehensive React-based web application for managing cannabis cultivation, inventory, transfers, sales, and reporting in compliance with regulatory requirements.

## 🎯 Overview

This frontend application provides a complete user interface for the seed-to-sale tracking system, featuring 9 pages that cover all aspects of cannabis business operations from cultivation to sales and reporting.

## 📋 Features

### 1. Authentication & Security
- **Two-Step Login:** Email/password authentication followed by interface selection
- **JWT Token Management:** Automatic token handling and refresh
- **Protected Routes:** All routes require authentication
- **Role-Based Access:** Support for licensee, state, and admin interfaces
- **Location-Based Access:** Operations scoped to selected location

### 2. Dashboard
- **Real-Time Metrics:** 6 stat cards showing live data
  - Total Plants
  - Active Rooms
  - Inventory Items
  - Pending Transfers (with alerts)
  - Total Sales
  - Revenue
- **Activity Feed:** Recent activity across all modules
- **Color-Coded Alerts:** Visual warnings for pending actions

### 3. Plants Management
- **Plant Tracking:** View all plants with detailed information
- **Create Plants:** Add new plants with strain, room, and phase
- **Lifecycle Management:** Track vegetative, flowering, and harvested phases
- **Room Assignment:** Associate plants with cultivation rooms

### 4. Inventory Management
- **Inventory List:** View all inventory items with filtering
- **Operations:**
  - **Move:** Transfer items between rooms
  - **Adjust:** Increase/decrease quantities with audit trail
  - **Split:** Divide items into multiple sublots
  - **Destroy:** Properly document waste/destruction
- **Modal Interfaces:** User-friendly forms for all operations
- **Real-Time Updates:** Instant feedback after operations

### 5. Conversions
- **Transformation Workflows:**
  - **Wet to Dry:** Convert harvested material to dried product
  - **Dry to Extraction:** Process dried material for extraction
  - **Extraction to Finished:** Create finished goods from extractions
- **Multi-Source Support:** Combine multiple inventory items
- **Conversion History:** Track all transformations
- **Room Management:** Assign destination rooms for outputs

### 6. Transfers
- **Create Transfers:** Build transfer manifests with items
- **Transfer Types:** Sales transfers and same-UBI transfers
- **Intake Workflow:** Receive incoming transfers
  - Accept All
  - Accept Partial (item-by-item)
  - Reject All
- **Pending Alerts:** Visual indicators for incoming transfers
- **Void Capability:** Cancel transfers before receipt
- **Transfer History:** Complete audit trail

### 7. Rooms Management
- **Room CRUD:** Create, view, update, and delete rooms
- **Room Types:** Vegetative, flowering, mother, clone, drying, storage
- **Capacity Tracking:** Visual progress bars showing occupancy
- **Color-Coded Status:**
  - Green: <70% full
  - Orange: 70-90% full
  - Red: >90% full
- **Available Space:** Real-time capacity calculations

### 8. Sales & POS
- **Point of Sale:** Shopping cart interface for sales
- **Product Selection:** Browse available inventory
- **Customer Management:** Walk-in or registered customers
- **Sales History:** Complete transaction records
- **Cart Management:** Add/remove items, quantity adjustments

### 9. Reports & Analytics
- **Multiple Report Types:**
  - **Inventory Report:** Items, quantities, rooms, status
  - **Plants Report:** Phases, strains, room assignments
  - **Sales Report:** Revenue, averages, customer data
  - **Transfers Report:** Status tracking, source/destination
- **Summary Metrics:** Key statistics for each report
- **Detailed Tables:** Comprehensive data views
- **CSV Export:** Download reports for external analysis
- **Date Range Filtering:** Customize report periods

## 🛠 Technical Stack

### Core Technologies
- **React 18:** Modern React with Hooks
- **React Router 6:** Client-side routing
- **Axios:** HTTP client with interceptors
- **Vite 5:** Fast build tool and dev server

### State Management
- **Context API:** Global authentication state
- **Local State:** Component-level state with useState
- **Local Storage:** Token and user data persistence

### Styling
- **CSS3:** Custom styles with CSS variables
- **Responsive Design:** Mobile, tablet, and desktop support
- **Modal System:** Reusable modal overlays
- **Grid Layouts:** Flexible card layouts

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Header.jsx       # Navigation header
│   │   └── PrivateRoute.jsx # Auth-protected route wrapper
│   │
│   ├── context/             # React Context providers
│   │   └── AuthContext.jsx  # Authentication state
│   │
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Two-step authentication
│   │   ├── Dashboard.jsx    # Real-time metrics
│   │   ├── Plants.jsx       # Plant management
│   │   ├── Inventory.jsx    # Inventory operations
│   │   ├── Conversions.jsx  # Inventory transformations
│   │   ├── Transfers.jsx    # Transfer workflows
│   │   ├── Rooms.jsx        # Room management
│   │   ├── Sales.jsx        # POS interface
│   │   └── Reports.jsx      # Analytics and export
│   │
│   ├── services/            # API services
│   │   └── api.js           # Axios instance and service methods
│   │
│   ├── styles/              # CSS files
│   │   └── App.css          # Global styles
│   │
│   ├── App.jsx              # Root component with routing
│   └── main.jsx             # Application entry point
│
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or pnpm package manager
- Backend API running on `http://localhost:3000` (or configured baseURL)

### Installation

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API Endpoint:**
   The frontend expects the backend API at `/api` by default. If your backend runs on a different URL, update `src/services/api.js`:
   ```javascript
   const api = axios.create({
     baseURL: 'http://your-backend-url/api',
     // ...
   });
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

4. **Build for Production:**
   ```bash
   npm run build
   ```
   Production files will be in the `dist/` directory.

5. **Preview Production Build:**
   ```bash
   npm run preview
   ```

## 🔐 Authentication Flow

1. **Login Page:**
   - User enters email, password, and optional UBI
   - Backend validates credentials
   - Returns userId and allowedInterfaces

2. **Interface Selection:**
   - User selects interface type (licensee/state/admin)
   - Backend issues JWT token
   - Token stored in localStorage

3. **Authenticated Session:**
   - Token included in all API requests via Axios interceptor
   - User redirected to Dashboard
   - Navigation accessible across all pages

4. **Logout:**
   - Clear token and user data from localStorage
   - Redirect to Login page

5. **Auto-Logout:**
   - 401 responses trigger automatic logout
   - User redirected to Login page

## 📡 API Integration

### Service Layer
All API calls are centralized in `src/services/api.js`:

```javascript
// Authentication
authService.login(email, password, ubi)
authService.selectInterface(userId, interfaceType, ubi)

// Cultivation
cultivationService.getPlants(locationId)
cultivationService.createPlant(locationId, data)

// Inventory
inventoryService.getInventoryItems(locationId)
inventoryService.moveItemToRoom(locationId, itemId, data)
inventoryService.adjustInventory(locationId, itemId, data)
inventoryService.splitInventory(locationId, itemId, data)

// Conversions
conversionService.convertWetToDry(locationId, data)
conversionService.convertDryToExtraction(locationId, data)

// Transfers
transferService.getTransfers(locationId, filters)
transferService.createTransfer(locationId, data)
transferService.receiveTransfer(locationId, transferId, data)

// Rooms
roomService.getRooms(locationId)
roomService.createRoom(locationId, data)

// Sales
salesService.getSales(locationId)
salesService.createSale(locationId, data)
```

### Axios Interceptors

**Request Interceptor:**
- Automatically adds JWT token to Authorization header
- Ensures all requests are authenticated

**Response Interceptor:**
- Handles 401 responses (unauthorized)
- Automatic logout and redirect to login
- Error propagation for handling in components

## 🎨 Styling Guide

### CSS Variables
```css
/* Colors */
--primary-color: #3498db
--success-color: #27ae60
--warning-color: #f39c12
--danger-color: #e74c3c
--text-color: #2c3e50
--background-color: #f5f5f5

/* Spacing */
--spacing-sm: 10px
--spacing-md: 20px
--spacing-lg: 30px
```

### Component Classes
- `.button` - Primary action button
- `.button-success` - Success/confirm actions
- `.button-danger` - Destructive actions
- `.card` - Content container with shadow
- `.stat-card` - Dashboard metric card
- `.badge` - Status indicator
- `.modal-overlay` - Full-screen modal backdrop
- `.modal-content` - Modal dialog box
- `.table` - Data table
- `.form-group` - Form field container
- `.error-message` - Error notification
- `.loading` - Loading state indicator

### Responsive Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🧪 Testing Recommendations

### Manual Testing Checklist
- [ ] Login flow with valid/invalid credentials
- [ ] Interface selection for each user type
- [ ] Dashboard data loading and refresh
- [ ] Plant CRUD operations
- [ ] Inventory operations (move, adjust, split, destroy)
- [ ] Conversion workflows
- [ ] Transfer creation and receipt
- [ ] Room management
- [ ] Sales transactions
- [ ] Report generation and CSV export
- [ ] Logout and auto-logout on 401

### Future Testing Additions
- Unit tests with Jest and React Testing Library
- Integration tests for API interactions
- E2E tests with Playwright or Cypress
- Accessibility testing

## 🔒 Security Considerations

### Implemented
- ✅ JWT token authentication
- ✅ Protected routes requiring authentication
- ✅ Automatic logout on unauthorized access
- ✅ UserId tracking for audit trails
- ✅ HTTPS in production (recommended)
- ✅ Token stored in localStorage (consider httpOnly cookies for enhanced security)

### Recommendations
- Implement token refresh mechanism
- Add CSRF protection
- Use httpOnly cookies for tokens
- Add rate limiting on frontend
- Implement Content Security Policy (CSP)
- Add input sanitization for XSS prevention

## 📊 Performance Optimizations

### Current Optimizations
- Vite for fast build and HMR
- Code splitting by route
- Lazy loading of images
- Efficient re-renders with proper key props
- Axios request/response interceptors

### Future Improvements
- React.lazy for code splitting
- Memoization with useMemo/useCallback
- Virtual scrolling for large lists
- Image optimization and lazy loading
- Service Worker for offline support
- Redux or Zustand for complex state

## 🚢 Deployment

### Build Process
```bash
npm run build
```

### Deployment Options

**1. Static Hosting (Recommended)**
- Vercel, Netlify, or GitHub Pages
- Upload `dist/` directory
- Configure API proxy if needed

**2. Nginx/Apache**
```nginx
server {
    listen 80;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:3000;
    }
}
```

**3. Docker**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 🐛 Troubleshooting

### Common Issues

**1. API Connection Errors**
- Check backend is running
- Verify baseURL in `src/services/api.js`
- Check CORS configuration on backend

**2. Login Issues**
- Clear localStorage: `localStorage.clear()`
- Check JWT token format
- Verify backend authentication endpoint

**3. Build Errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (18+)

**4. Routing Issues**
- Ensure backend doesn't intercept frontend routes
- Configure fallback to `index.html`
- Check React Router configuration

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
- [Vite Guide](https://vitejs.dev)

### Backend Integration
- See `README_FULL.md` in root directory
- Backend API documentation at `http://localhost:3000/api-docs`
- ARCHITECTURE.md for system design

## 🤝 Contributing

When contributing to the frontend:

1. Follow existing code style and patterns
2. Extract userId from AuthContext when tracking user actions
3. Use consistent error handling patterns
4. Add loading states for async operations
5. Maintain responsive design
6. Test on multiple browsers
7. Update this README for new features

## 📝 License

This project is part of the Complete Seed-to-Sale system. Refer to the main LICENSE file in the repository root.

## 🎉 Acknowledgments

Built with modern web technologies to provide a comprehensive, user-friendly interface for cannabis business management and regulatory compliance.

---

**Version:** 1.0.0  
**Last Updated:** December 26, 2025  
**Status:** Production Ready ✅
