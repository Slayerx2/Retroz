# Changelog

All notable changes to CaféPOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-20

### Added
- **Phase 1-8**: Initial restaurant management system
  - Login page with role-based authentication
  - Waiter interface for order creation and checkout
  - Kitchen display for order management
  - Admin dashboard for menu and settings management
  - Table management with visual status
  - Order status tracking (sent → preparing → ready → completed)
  - Payment processing with multiple methods (cash, card, mobile)
  - Receipt printing in thermal format
  - Menu categories and product management
  - VAT and service charge calculations
  - Basic responsive design

- **Phase 9**: Local Data Model
  - Structured storage service with versioned keys (`cafe_v1_*`)
  - Safe JSON parsing with fallback defaults
  - Schema migration support for future updates
  - Order item snapshots to preserve historical prices
  - Comprehensive order schema with all required fields
  - Sample seed data for initial setup
  - Data schema version tracking (1.0.0)
  - Normalization functions for orders, products, and settings
  - Unique ID and order number generation

- **Phase 10**: Audit Logging
  - Audit logging for login/logout events
  - Audit logging for order creation and status changes
  - Audit logging for payment completion
  - Audit logging for menu item changes (create, edit, availability)
  - Audit logging for settings changes
  - Audit log display in admin section with filters
  - Color-coded action badges
  - Capped audit log length (1000 entries)

- **Phase 11**: Accessibility and Responsiveness
  - Responsive design for 1366×768, 1920×1080, tablets, and mobile
  - No horizontal overflow across all screen sizes
  - Keyboard navigation (Escape closes modals, Enter submits forms)
  - ARIA labels and roles for accessibility
  - Color-independent status indicators with icons
  - Touch-friendly controls for mobile devices
  - Semantic HTML structure
  - Focus management for modals

- **Phase 12**: Reliability Improvements
  - Custom modal system (confirm, alert, prompt, loading)
  - Double-click protection for order submission and payment
  - Cart state persistence on page refresh (2-hour expiry)
  - Invalid localStorage JSON error recovery
  - Unavailable item detection in cart
  - Empty order validation
  - Table selection validation for dine-in orders
  - Duplicate order number prevention
  - Loading states for buttons during operations
  - Confirmation dialogs for destructive actions
  - Error states and empty states

- **Phase 13**: Backend Preparation
  - Service module architecture for data abstraction
  - `authService.js` - Authentication operations
  - `orderService.js` - Order CRUD operations
  - `productService.js` - Product/menu management
  - `tableService.js` - Table management
  - `reportService.js` - Sales reports and analytics
  - `settingsService.js` - Settings management
  - All services backward-compatible with localStorage
  - Comprehensive BACKEND_MIGRATION.md for Supabase migration

- **Phase 14**: Documentation
  - Comprehensive README.md with project overview
  - Demo accounts and role descriptions
  - Project structure documentation
  - LocalStorage data model documentation
  - Known limitations and production requirements
  - CHANGELOG.md for version tracking
  - TESTING_CHECKLIST.md for manual testing procedures

### Changed
- Replaced browser `alert()` and `confirm()` with custom modal system
- Updated authentication to use structured storage service
- Improved error handling throughout the application
- Enhanced responsive design across all breakpoints
- Added accessibility features (keyboard navigation, ARIA labels)

### Fixed
- Fixed cart state loss on page refresh
- Fixed duplicate order submissions on double-click
- Fixed invalid JSON crashes in localStorage
- Fixed unavailable items being added to cart
- Fixed empty order submission without validation
- Fixed dine-in orders without table selection

### Security
- Note: Current implementation uses localStorage for demonstration purposes
- Not production-ready - see BACKEND_MIGRATION.md for secure backend implementation
- Passwords stored in plain text (temporary)
- Client-side authentication (temporary)
- No server-side validation (temporary)

## [0.9.0] - Earlier Versions

### Added
- Initial restaurant management system
- Basic order creation and tracking
- Simple kitchen display
- Basic menu management
- Table management
- Payment processing
- Receipt printing

### Known Issues
- Hardcoded credentials in frontend
- No audit logging
- Limited error handling
- No cart persistence
- No accessibility features
- Limited responsive design

---

## Version History Summary

| Version | Date | Major Changes |
|---------|------|---------------|
| 1.0.0 | 2026-07-20 | Complete POS system with reliability, accessibility, and backend preparation |
| 0.9.0 | Earlier | Initial MVP with basic functionality |

## Future Plans

### Version 2.0.0 (Planned)
- Supabase backend integration
- Real-time multi-device sync
- Server-side authentication
- Enhanced security features
- Offline mode support
- Advanced reporting
- Inventory management
- Customer management

See [BACKEND_MIGRATION.md](BACKEND_MIGRATION.md) for detailed migration plan.
