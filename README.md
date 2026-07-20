# CaféPOS - Restaurant Management System

A modern, responsive restaurant Point of Sale (POS) system built with vanilla HTML, CSS, and JavaScript. Designed for cafés and restaurants with dine-in and takeaway capabilities.

## Project Overview

CaféPOS is a client-side restaurant management system that provides:
- **Order Management**: Create, track, and manage orders with real-time status updates
- **Kitchen Display**: Visual kitchen order management with status tracking
- **Menu Management**: Full product catalog with categories, pricing, and availability
- **Staff Roles**: Role-based access for Admin, Waiter, and Cook
- **Reporting**: Sales reports, payment breakdowns, and performance analytics
- **Audit Logging**: Comprehensive audit trail for all important actions

## Current Features

### Core Functionality
- **Order Creation**: Add items to cart, assign tables, submit to kitchen
- **Order Tracking**: Real-time status updates (sent → preparing → ready → completed)
- **Payment Processing**: Multiple payment methods (cash, card, mobile) with change calculation
- **Receipt Printing**: Thermal receipt format with order details
- **Table Management**: Visual table status with occupancy tracking
- **Menu Management**: Add/edit products, toggle availability, manage categories
- **Kitchen Display**: Visual order cards with status controls
- **Admin Dashboard**: Overview metrics, order management, reports, settings
- **Audit Logs**: Track login, logout, order changes, menu updates, settings changes

### Reliability Features
- **Cart Persistence**: Restores cart state after page refresh (2-hour expiry)
- **Double-Click Protection**: Prevents duplicate order submissions and payments
- **Error Recovery**: Handles invalid localStorage JSON gracefully
- **Validation**: Empty order checks, table selection validation, unavailable item detection
- **Loading States**: Visual feedback during operations
- **Custom Modals**: Reusable modal system (no browser alerts)

### Accessibility & Responsiveness
- **Responsive Design**: Optimized for 1366×768, 1920×1080, tablets, and mobile
- **Keyboard Navigation**: Escape key closes modals, Enter submits forms
- **Color-Independent Status**: Status indicators use icons, not just colors
- **Touch-Friendly**: Large touch targets for mobile devices
- **Semantic HTML**: Proper ARIA labels and roles

## Demo Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | admin | admin123 | Full access to all features |
| Waiter | waiter1 | waiter123 | Order creation, checkout, table management |
| Waiter | waiter2 | waiter123 | Order creation, checkout, table management |
| Cook | cook1 | cook123 | Kitchen display, order status updates |
| Cook | cook2 | cook123 | Kitchen display, order status updates |

## Project Structure

```
Retroz/
├── assets/
│   ├── css/
│   │   ├── admin.css          # Admin dashboard styles
│   │   ├── base.css           # Base styles and custom modals
│   │   ├── components.css     # Reusable component styles
│   │   ├── kitchen.css        # Kitchen display styles
│   │   └── waiter.css         # Waiter interface styles
│   ├── img/                   # Product images
│   └── js/
│       ├── auth-temp.js       # Temporary client-side authentication
│       ├── common.js          # Shared utilities and route protection
│       ├── cook.js            # Kitchen display logic
│       ├── dashboard.js       # Admin dashboard logic
│       ├── modal-utils.js      # Custom modal system
│       ├── storage-service.js # Structured localStorage service
│       ├── waiter.js           # Waiter interface logic
│       └── services/          # Service modules (future Supabase migration)
│           ├── authService.js
│           ├── orderService.js
│           ├── productService.js
│           ├── reportService.js
│           ├── settingsService.js
│           └── tableService.js
├── css/
│   ├── admin.css              # Legacy admin styles
│   ├── base.css               # Legacy base styles
│   ├── components.css         # Legacy component styles
│   └── kitchen.css            # Legacy kitchen styles
├── pages/
│   ├── admin.html             # Admin dashboard
│   ├── kitchen.html           # Kitchen display
│   ├── login.html             # Login page
│   └── waiter.html            # Waiter interface
├── BACKEND_MIGRATION.md       # Supabase migration guide
├── CHANGELOG.md               # Version history
├── package.json               # Node.js dependencies
├── README.md                  # This file
├── server.js                  # Express server (for future backend)
└── TESTING_CHECKLIST.md       # Manual testing procedures
```

## How to Run Locally

### Option 1: Simple HTTP Server (Recommended for Development)

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/ (LTS version)

2. **Install http-server globally**
   ```bash
   npm install -g http-server
   ```

3. **Start the server**
   ```bash
   http-server -p 3000
   ```

4. **Access the application**
   - Open browser to http://localhost:3000
   - Navigate to pages/login.html

### Option 2: Using Python

```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

### Option 3: Using PHP

```bash
php -S localhost:3000
```

### Option 4: Express Server (Future Backend)

```bash
npm install
npm start
```

## Roles and Permissions

### Admin
- **Full Access**: All features and settings
- **Menu Management**: Add, edit, delete products, toggle availability
- **Staff Management**: View and manage users (future backend)
- **Reports**: View all reports and export data
- **Settings**: Configure café settings, VAT, service charges
- **Audit Logs**: View complete audit trail

### Waiter
- **Order Creation**: Create orders, add items, assign tables
- **Order Management**: View active orders, request bill
- **Checkout**: Process payments, print receipts
- **Table Management**: View table status, assign tables
- **Menu View**: View available menu items (read-only)

### Cook
- **Kitchen Display**: View all active orders
- **Status Updates**: Update order status (sent → preparing → ready)
- **Order Details**: View order items, notes, and preparation time
- **Filtering**: Filter by status (sent, preparing, ready)

## LocalStorage Data Model

### Storage Keys (Versioned)
All data uses versioned keys prefixed with `cafe_v1_`:

| Key | Entity | Description |
|-----|--------|-------------|
| cafe_v1_users | users | User accounts and roles |
| cafe_v1_session | session | Current user session |
| cafe_v1_settings | settings | Café configuration |
| cafe_v1_tables | tables | Table definitions |
| cafe_v1_categories | categories | Product categories |
| cafe_v1_products | products | Menu items |
| cafe_v1_orders | orders | Order records |
| cafe_v1_order_items | order_items | Order line items |
| cafe_v1_payments | payments | Payment records |
| cafe_v1_announcements | announcements | Kitchen/waiter announcements |
| cafe_v1_audit_logs | audit_logs | Audit trail |

### Order Schema
```javascript
{
    id: "o_1234567890",
    orderNumber: "ORD-0001",
    businessDate: "2026-07-20",
    tableId: 1,
    orderType: "dinein", // or "takeaway"
    status: "sent", // draft, sent, preparing, ready, completed, paid, cancelled
    waiterId: "waiter1",
    items: [
        {
            productId: 1,
            productName: "Cappuccino",
            unitPrice: 150,
            quantity: 2,
            itemNote: "Extra hot",
            lineTotal:300
        }
    ],
    subtotal: 300,
    VAT: 39,
    serviceCharge: 30,
    discount: 0,
    tip: 50,
    total: 369,
    notes: "Customer requested extra napkins",
    createdAt: "2026-07-20T12:00:00Z",
    updatedAt: "2026-07-20T12:05:00Z",
    statusHistory: [
        {
            status: "sent",
            timestamp: "2026-07-20T12:00:00Z",
            userId: "waiter1"
        }
    ]
}
```

### Product Schema
```javascript
{
    id: 1,
    name: "Cappuccino",
    category: "coffee",
    price: 150,
    description: "Rich espresso with steamed milk",
    imageUrl: "assets/img/cappuccino.png",
    vegetarian: true,
    preparationTime: 5,
    available: true,
    archived: false,
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-07-20T00:00:00Z"
}
```

## Known Limitations

### Current Implementation (LocalStorage)
- **Single Device**: Data is stored locally, no multi-device sync
- **No Real-time Updates**: Changes don't sync across browsers/devices
- **Data Loss Risk**: Clearing browser data deletes all orders and settings
- **Storage Limit**: Limited to ~5-10MB per domain
- **No Backup**: No automatic backup or version history
- **Security**: Data stored in plain text (accessible via console)
- **No Server Validation**: All validation happens client-side

### Future Improvements
- **Backend Migration**: See BACKEND_MIGRATION.md for Supabase migration plan
- **Multi-device Support**: Real-time sync across devices
- **Offline Mode**: Service worker for offline functionality
- **Advanced Reports**: More detailed analytics and exports
- **Inventory Management**: Track stock levels and alerts
- **Customer Management**: Customer profiles and order history

## Production Requirements

### Minimum Requirements
- **Browser**: Modern browser with ES6 support (Chrome 90+, Firefox 88+, Safari 14+)
- **Screen Resolution**: 1366×768 minimum (optimized for 1920×1080)
- **JavaScript**: Enabled
- **LocalStorage**: Enabled and available
- **Network**: For loading images and assets

### Recommended
- **Screen Resolution**: 1920×1080 for optimal experience
- **Device**: Tablet or desktop for kitchen display
- **Printer**: Thermal printer for receipts (58mm or 80mm)

### Security Considerations (Current)
- **Not Production-Ready**: Current implementation uses localStorage
- **Client-Side Auth**: Authentication happens in browser
- **No Encryption**: Data stored in plain text
- **No Audit Trail**: Limited logging capabilities

### Security Considerations (After Backend Migration)
- **Server-Side Auth**: Supabase Auth with JWT tokens
- **Encrypted Storage**: Passwords hashed with bcrypt
- **Row-Level Security**: Role-based access control in database
- **Audit Logging**: Comprehensive audit trail
- **HTTPS Required**: All data transmitted securely

## Future Backend Migration Plan

The system is designed to be easily migrated to a backend. See [BACKEND_MIGRATION.md](BACKEND_MIGRATION.md) for:
- Complete Supabase table schemas
- Row-Level Security policies
- Authentication flow
- Real-time subscription patterns
- Step-by-step migration guide
- Service module architecture for easy backend integration

## Development

### Adding New Features
1. Use the existing service modules in `assets/js/services/`
2. Follow the established code patterns
3. Add audit logging for important actions
4. Test responsive design at all breakpoints
5. Ensure accessibility compliance

### Code Style
- **Vanilla JavaScript**: No frameworks or large dependencies
- **Modular**: Separate concerns into service modules
- **Semantic**: Use descriptive variable and function names
- **Commented**: Add comments for complex logic
- **No Inline Styles**: Use CSS classes instead
- **No Inline Handlers**: Use addEventListener instead

### Testing
See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for comprehensive manual testing procedures.

## License

This project is for demonstration purposes. Feel free to use and modify as needed.

## Support

For issues or questions, please refer to the documentation files:
- [BACKEND_MIGRATION.md](BACKEND_MIGRATION.md) - Backend migration guide
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Testing procedures
