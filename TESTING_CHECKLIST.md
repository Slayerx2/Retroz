# Testing Checklist

This document provides comprehensive manual testing procedures for CaféPOS. Use this checklist to verify all features are working correctly before deployment.

## Prerequisites

- Application running locally (http://localhost:3000)
- Modern browser (Chrome, Firefox, Safari, Edge)
- LocalStorage enabled
- JavaScript enabled

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Waiter | waiter1 | waiter123 |
| Cook | cook1 | cook123 |

---

## Authentication Tests

### Test 1.1: Valid Login
- [ ] Navigate to login page
- [ ] Enter valid username (admin)
- [ ] Enter valid password (admin123)
- [ ] Click "Login" button
- [ ] **Expected**: Redirect to admin dashboard
- [ ] **Expected**: Session stored in localStorage
- [ ] **Expected**: Audit log entry created for login

### Test 1.2: Invalid Login - Wrong Password
- [ ] Enter valid username (admin)
- [ ] Enter invalid password (wrong123)
- [ ] Click "Login" button
- [ ] **Expected**: Error message displayed
- [ ] **Expected**: No redirect
- [ ] **Expected**: No session created

### Test 1.3: Invalid Login - Wrong Username
- [ ] Enter invalid username (nonexistent)
- [ ] Enter any password
- [ ] Click "Login" button
- [ ] **Expected**: Error message displayed
- [ ] **Expected**: No redirect
- [ ] **Expected**: No session created

### Test 1.4: Empty Login Fields
- [ ] Leave username empty
- [ ] Leave password empty
- [ ] Click "Login" button
- [ ] **Expected**: Validation error
- [ ] **Expected**: No redirect

### Test 1.5: Remember Username
- [ ] Check "Remember username" checkbox
- [ ] Login with valid credentials
- [ ] Logout
- [ ] **Expected**: Username pre-filled on next login

### Test 1.6: Password Visibility Toggle
- [ ] Enter password
- [ ] Click eye icon
- [ ] **Expected**: Password visible
- [ ] Click eye icon again
- [ ] **Expected**: Password hidden

### Test 1.7: Logout
- [ ] Login as any user
- [ ] Click logout button
- [ ] **Expected**: Redirect to login page
- [ ] **Expected**: Session cleared from localStorage
- [ ] **Expected**: Audit log entry created for logout

---

## Access Control Tests

### Test 2.1: Admin Access to All Pages
- [ ] Login as admin
- [ ] Try to access admin.html
- [ ] **Expected**: Access granted
- [ ] Try to access waiter.html
- [ ] **Expected**: Access granted
- [ ] Try to access kitchen.html
- [ ] **Expected**: Access granted

### Test 2.2: Waiter Access Restrictions
- [ ] Login as waiter1
- [ ] Try to access admin.html
- [ ] **Expected**: Access denied, redirect to waiter page
- [ ] Try to access waiter.html
- [ ] **Expected**: Access granted
- [ ] Try to access kitchen.html
- [ ] **Expected**: Access denied, redirect to waiter page

### Test 2.3: Cook Access Restrictions
- [ ] Login as cook1
- [ ] Try to access admin.html
- [ ] **Expected**: Access denied, redirect to kitchen page
- [ ] Try to access waiter.html
- [ ] **Expected**: Access denied, redirect to kitchen page
- [ ] Try to access kitchen.html
- [ ] **Expected**: Access granted

### Test 2.4: Direct URL Access Without Login
- [ ] Clear localStorage/session
- [ ] Try to access admin.html directly
- [ ] **Expected**: Redirect to login page
- [ ] Try to access waiter.html directly
- [ ] **Expected**: Redirect to login page
- [ ] Try to access kitchen.html directly
- [ ] **Expected**: Redirect to login page

---

## Order Creation Tests

### Test 3.1: Create Dine-in Order
- [ ] Login as waiter
- [ ] Select "Dine-in" order type
- [ ] Select a table (e.g., Table 1)
- [ ] Add items to cart
- [ ] Click "Send to Kitchen"
- [ ] **Expected**: Order created successfully
- [ ] **Expected**: Cart cleared
- [ ] **Expected**: Table marked as occupied
- [ ] **Expected**: Order appears in active orders
- [ ] **Expected**: Audit log entry created

### Test 3.2: Create Takeaway Order
- [ ] Login as waiter
- [ ] Select "Take Away" order type
- [ ] Add items to cart
- [ ] Click "Send to Kitchen"
- [ ] **Expected**: Order created successfully
- [ ] **Expected**: Cart cleared
- [ ] **Expected**: Order appears in active orders

### Test 3.3: Empty Order Submission
- [ ] Login as waiter
- [ ] Don't add any items to cart
- [ ] Click "Send to Kitchen"
- [ ] **Expected**: Custom modal error displayed
- [ ] **Expected**: Order not created
- [ ] **Expected**: Cart remains empty

### Test 3.4: Order Without Table (Dine-in)
- [ ] Login as waiter
- [ ] Select "Dine-in" order type
- [ ] Don't select a table
- [ ] Add items to cart
- [ ] Click "Send to Kitchen"
- [ ] **Expected**: Custom modal error displayed
- [ ] **Expected**: Order not created

### Test 3.5: Add Item to Cart
- [ ] Login as waiter
- [ ] Click on a menu item
- [ ] **Expected**: Item added to cart
- [ ] **Expected**: Cart total updated
- [ ] **Expected**: Cart item count updated

### Test 3.6: Increase Item Quantity
- [ ] Add item to cart
- [ ] Click "+" button on cart item
- [ ] **Expected**: Quantity increased
- [ ] **Expected**: Total updated

### Test 3.7: Decrease Item Quantity
- [ ] Add item with quantity > 1
- [ ] Click "-" button on cart item
- [ ] **Expected**: Quantity decreased
- [ ] **Expected**: Total updated

### Test 3.8: Remove Item from Cart
- [ ] Add item to cart
- [ ] Click "Remove" button
- [ ] **Expected**: Item removed from cart
- [ ] **Expected**: Total updated

### Test 3.9: Add Item Note
- [ ] Add item to cart
- [ ] Click "Add Note" on cart item
- [ ] Enter note text
- [ ] **Expected**: Note saved with item

### Test 3.10: Apply Discount
- [ ] Add items to cart
- [ ] Enter discount amount
- [ ] **Expected**: Total recalculated with discount
- [ ] **Expected**: Discount shown in summary

### Test 3.11: Double-Click Protection
- [ ] Add items to cart
- [ ] Rapidly double-click "Send to Kitchen"
- [ ] **Expected**: Only one order created
- [ ] **Expected**: Button shows "Submitting..." state
- [ ] **Expected**: Button disabled during submission

---

## Table Assignment Tests

### Test 4.1: Select Table
- [ ] Login as waiter
- [ ] Click on a table
- [ ] **Expected**: Table highlighted as selected
- [ ] **Expected**: Table info displayed

### Test 4.2: Table Status Display
- [ ] Login as waiter
- [ ] Create order for Table 1
- [ ] **Expected**: Table 1 shows as occupied
- [ ] **Expected**: Table color changed

### Test 4.3: Table Availability
- [ ] Login as waiter
- [ ] Create order for Table 1
- [ ] Try to create another order for Table 1
- [ ] **Expected**: Warning displayed (table already in use)

### Test 4.4: Clear Table Assignment
- [ ] Login as waiter
- [ ] Select a table
- [ ] Clear cart
- [ ] **Expected**: Table selection cleared

### Test 4.5: Table Capacity Display
- [ ] Login as waiter
- [ ] Hover over table
- [ ] **Expected**: Table capacity shown

---

## Kitchen Status Update Tests

### Test 5.1: View New Orders
- [ ] Login as cook
- [ ] Create order from waiter account
- [ ] Switch to kitchen display
- [ ] **Expected**: Order appears in "Sent" section
- [ ] **Expected**: Order details visible (items, table, waiter)

### Test 5.2: Update Status to Preparing
- [ ] Login as cook
- [ ] Click "Start Preparing" on an order
- [ ] **Expected**: Order moves to "Preparing" section
- [ ] **Expected**: Status badge updated
- [ ] **Expected**: Audit log entry created

### Test 5.3: Update Status to Ready
- [ ] Login as cook
- [ ] Click "Mark Ready" on preparing order
- [ ] **Expected**: Order moves to "Ready" section
- [ ] **Expected**: Status badge updated
- [ ] **Expected**: Audit log entry created

### Test 5.4: Filter by Status
- [ ] Login as cook
- [ ] Click status filter (e.g., "Preparing")
- [ ] **Expected**: Only preparing orders shown
- [ ] **Expected**: Other orders hidden

### Test 5.5: View Order Details
- [ ] Login as cook
- [ ] Click on an order card
- [ ] **Expected**: Full order details displayed
- [ ] **Expected**: Items with quantities shown
- [ ] **Expected**: Order notes visible

### Test 5.6: Order Time Display
- [ ] Login as cook
- [ ] Check order cards
- [ ] **Expected**: Order time displayed
- [ ] **Expected**: Time elapsed shown for delayed orders

### Test 5.7: Warning for Delayed Orders
- [ ] Login as cook
- [ ] Wait for order to exceed warning time
- [ ] **Expected**: Order card highlighted
- [ ] **Expected**: Warning indicator shown

---

## Checkout Tests

### Test 6.1: Initiate Checkout
- [ ] Login as waiter
- [ ] Create an order
- [ ] Click "Checkout" on active order
- [ ] **Expected**: Checkout modal opens
- [ ] **Expected**: Order details displayed
- [ ] **Expected**: Total amount shown

### Test 6.2: Cash Payment - Exact Amount
- [ ] Select "Cash" payment method
- [ ] Enter exact amount due
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Payment processed
- [ ] **Expected**: Change due: 0
- [ ] **Expected**: Order status changed to "paid"
- [ ] **Expected**: Success modal displayed
- [ ] **Expected**: Audit log entry created

### Test 6.3: Cash Payment - With Change
- [ ] Select "Cash" payment method
- [ ] Enter amount greater than due
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Payment processed
- [ ] **Expected**: Change due calculated correctly
- [ ] **Expected**: Order status changed to "paid"

### Test 6.4: Cash Payment - Insufficient Amount
- [ ] Select "Cash" payment method
- [ ] Enter amount less than due
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Custom modal error displayed
- [ ] **Expected**: Payment not processed

### Test 6.5: Card Payment
- [ ] Select "Card" payment method
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Payment processed
- [ ] **Expected**: Order status changed to "paid"
- [ ] **Expected**: No change due shown

### Test 6.6: Mobile Payment
- [ ] Select "Mobile" payment method
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Payment processed
- [ ] **Expected**: Order status changed to "paid"

### Test 6.7: Add Tip
- [ ] Open checkout modal
- [ ] Enter tip amount
- [ ] **Expected**: Total recalculated with tip
- [ ] **Expected**: Tip shown in summary

### Test 6.8: Payment Confirmation Dialog
- [ ] Open checkout modal
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Custom confirmation modal shown
- [ ] **Expected**: Payment amount displayed
- [ ] **Expected**: Payment method shown

### Test 6.9: Double-Click Payment Protection
- [ ] Open checkout modal
- [ ] Rapidly double-click "Confirm Payment"
- [ ] **Expected**: Only one payment processed
- [ ] **Expected**: Button shows "Processing..." state
- [ ] **Expected**: Button disabled during processing

### Test 6.10: Cancel Checkout
- [ ] Open checkout modal
- [ ] Click "Cancel" or close modal
- [ ] **Expected**: Modal closes
- [ ] **Expected**: No payment processed
- [ ] **Expected**: Order remains unpaid

---

## Receipt Printing Tests

### Test 7.1: Print Receipt
- [ ] Complete payment
- [ ] Click "Print Receipt" in success modal
- [ ] **Expected**: Print dialog opens
- [ ] **Expected**: Receipt format correct
- [ ] **Expected**: All order details included

### Test 7.2: Receipt Content
- [ ] Print receipt
- [ ] **Expected**: Café name shown
- [ ] **Expected**: Order number shown
- [ ] **Expected**: Date/time shown
- [ ] **Expected**: Table/order type shown
- [ ] **Expected**: Items with quantities shown
- [ ] **Expected**: Prices shown
- [ ] **Expected**: Subtotal, VAT, service charge shown
- [ ] **Expected**: Total shown
- [ ] **Expected**: Payment method shown
- [ ] **Expected**: Receipt footer shown

### Test 7.3: Receipt for Takeaway
- [ ] Create takeaway order
- [ ] Complete payment
- [ ] Print receipt
- [ ] **Expected**: "Take Away" shown instead of table number

---

## Menu Availability Tests

### Test 8.1: Add New Product
- [ ] Login as admin
- [ ] Navigate to Menu section
- [ ] Click "Add Product"
- [ ] Fill in product details
- [ ] Click "Save"
- [ ] **Expected**: Product added to menu
- [ ] **Expected**: Product appears in waiter menu
- [ ] **Expected**: Audit log entry created

### Test 8.2: Edit Product
- [ ] Login as admin
- [ ] Navigate to Menu section
- [ ] Click "Edit" on a product
- [ ] Modify product details
- [ ] Click "Save"
- [ ] **Expected**: Product updated
- [ ] **Expected**: Changes reflected in waiter menu
- [ ] **Expected**: Audit log entry created

### Test 8.3: Toggle Product Availability
- [ ] Login as admin
- [ ] Navigate to Menu section
- [ ] Click availability toggle on a product
- [ ] **Expected**: Product marked as unavailable
- [ ] **Expected**: Product hidden from waiter menu
- [ ] **Expected**: Audit log entry created

### Test 8.4: Add Unavailable Item to Cart
- [ ] Login as admin
- [ ] Disable a product
- [ ] Login as waiter
- [ ] Try to add disabled product to cart
- [ ] **Expected**: Custom modal error displayed
- [ ] **Expected**: Item not added to cart

### Test 8.5: Archive Product
- [ ] Login as admin
- [ ] Navigate to Menu section
- [ ] Click "Archive" on a product
- [ ] **Expected**: Product archived
- [ ] **Expected**: Product hidden from menu
- [ ] **Expected**: Audit log entry created

### Test 8.6: Search Products
- [ ] Login as admin
- [ ] Navigate to Menu section
- [ ] Enter search term
- [ ] **Expected**: Only matching products shown
- [ ] **Expected**: Search works by name, description, category

### Test 8.7: Filter by Category
- [ ] Login as admin
- [ ] Navigate to Menu section
- [ ] Select category filter
- [ ] **Expected**: Only products in category shown

### Test 8.8: Waiter Menu Read-Only
- [ ] Login as waiter
- [ ] Navigate to menu
- [ ] **Expected**: Can view products
- [ ] **Expected**: Cannot edit products
- [ ] **Expected**: Cannot add products

---

## Reports Tests

### Test 9.1: View Overview Dashboard
- [ ] Login as admin
- [ ] Navigate to Overview section
- [ ] **Expected**: Today's orders count shown
- [ ] **Expected**: Today's revenue shown
- [ ] **Expected**: Active orders count shown
- [ ] **Expected**: Average order value shown

### Test 9.2: View Orders Report
- [ ] Login as admin
- [ ] Navigate to Orders section
- [ ] **Expected**: All orders listed
- [ ] **Expected**: Order details visible
- [ ] **Expected**: Status badges shown

### Test 9.3: Filter Orders by Date
- [ ] Login as admin
- [ ] Navigate to Orders section
- [ ] Select date range
- [ ] **Expected**: Only orders in range shown

### Test 9.4: Filter Orders by Status
- [ ] Login as admin
- [ ] Navigate to Orders section
- [ ] Select status filter
- [ ] **Expected**: Only orders with status shown

### Test 9.5: Filter Orders by Waiter
- [ ] Login as admin
- [ ] Navigate to Orders section
- [ ] Select waiter filter
- [ ] **Expected**: Only orders by waiter shown

### Test 9.6: Export Orders to CSV
- [ ] Login as admin
- [ ] Navigate to Orders section
- [ ] Click "Export CSV"
- [ ] **Expected**: CSV file downloaded
- [ ] **Expected**: File contains order data

### Test 9.7: View Audit Logs
- [ ] Login as admin
- [ ] Navigate to Audit Logs section
- [ ] **Expected**: Audit logs displayed
- [ ] **Expected**: Timestamp shown
- [ ] **Expected**: User shown
- [ ] **Expected**: Action shown
- [ ] **Expected**: Entity shown
- [ ] **Expected**: Description shown

### Test 9.8: Filter Audit Logs by Action
- [ ] Login as admin
- [ ] Navigate to Audit Logs section
- [ ] Select action filter
- [ ] **Expected**: Only matching logs shown

### Test 9.9: Filter Audit Logs by Entity
- [ ] Login as admin
- [ ] Navigate to Audit Logs section
- [ ] Select entity filter
- [ ] **Expected**: Only matching logs shown

---

## Responsive Layout Tests

### Test 10.1: Desktop (1920×1080)
- [ ] Open application on 1920×1080 screen
- [ ] **Expected**: Layout fills screen appropriately
- [ ] **Expected**: No horizontal overflow
- [ ] **Expected**: All elements visible
- [ ] **Expected**: Text readable

### Test 10.2: Laptop (1366×768)
- [ ] Open application on 1366×768 screen
- [ ] **Expected**: Layout adapts to screen
- [ ] **Expected**: No horizontal overflow
- [ ] **Expected**: All elements visible
- [ ] **Expected**: Text readable

### Test 10.3: Tablet (1024×768)
- [ ] Open application on tablet
- [ ] **Expected**: Layout adapts to tablet
- [ ] **Expected**: Touch targets large enough
- [ ] **Expected**: No horizontal overflow
- [ ] **Expected**: All elements accessible

### Test 10.4: Mobile (768px width)
- [ ] Open application on mobile
- [ ] **Expected**: Layout stacks vertically
- [ ] **Expected**: Sidebar collapses
- [ ] **Expected**: Touch targets large enough
- [ ] **Expected**: No horizontal overflow

### Test 10.5: Small Mobile (480px width)
- [ ] Open application on small mobile
- [ ] **Expected**: Layout fully responsive
- [ ] **Expected**: Text remains readable
- [ ] **Expected**: Buttons full width
- [ ] **Expected**: No horizontal overflow

### Test 10.6: Kitchen Display on Tablet
- [ ] Login as cook on tablet
- [ ] **Expected**: Order cards readable
- [ ] **Expected**: Status buttons touch-friendly
- [ ] **Expected**: All orders visible

---

## Refresh Persistence Tests

### Test 11.1: Cart State Persistence
- [ ] Login as waiter
- [ ] Add items to cart
- [ ] Select table
- [ ] Refresh page
- [ ] **Expected**: Cart items restored
- [ ] **Expected**: Table selection restored
- [ ] **Expected**: Toast notification shown

### Test 11.2: Cart State Expiry
- [ ] Login as waiter
- [ ] Add items to cart
- [ ] Wait 2+ hours (or manually expire in code)
- [ ] Refresh page
- [ ] **Expected**: Cart not restored
- [ ] **Expected**: Cart cleared

### Test 11.3: Session Persistence
- [ ] Login as any user
- [ ] Refresh page
- [ ] **Expected**: User remains logged in
- [ ] **Expected**: Redirected to correct page based on role

### Test 11.4: Settings Persistence
- [ ] Login as admin
- [ ] Change settings
- [ ] Refresh page
- [ ] **Expected**: Settings preserved
- [ ] **Expected**: Changes reflected

### Test 11.5: Menu Persistence
- [ ] Login as admin
- [ ] Add/edit product
- [ ] Refresh page
- [ ] **Expected**: Changes preserved
- [ ] **Expected**: Menu updated

---

## Invalid Data Handling Tests

### Test 12.1: Invalid localStorage JSON
- [ ] Manually corrupt localStorage data
- [ ] Refresh page
- [ ] **Expected**: Error handled gracefully
- [ ] **Expected**: App continues to function
- [ ] **Expected**: Corrupted data cleared

### Test 12.2: Missing localStorage Data
- [ ] Clear all localStorage
- [ ] Refresh page
- [ ] **Expected**: Seed data loaded
- [ ] **Expected**: App functions normally
- [ ] **Expected**: Default settings applied

### Test 12.3: Negative Quantity
- [ ] Try to set negative quantity in cart
- [ ] **Expected**: Quantity not allowed
- [ ] **Expected**: Validation error shown

### Test 12.4: Negative Discount
- [ ] Enter negative discount amount
- [ ] **Expected**: Not accepted
- [ ] **Expected**: Validation error shown

### Test 12.5: Invalid Characters in Fields
- [ ] Enter special characters in text fields
- [ ] **Expected**: Characters accepted or sanitized
- [ ] **Expected**: No crashes

### Test 12.6: Very Long Text Input
- [ ] Enter very long text in notes field
- [ ] **Expected**: Text accepted
- [ ] **Expected**: Displayed correctly
- [ ] **Expected**: No layout break

---

## Accessibility Tests

### Test 13.1: Keyboard Navigation
- [ ] Use Tab to navigate
- [ ] **Expected**: Focus moves logically
- [ ] **Expected**: All interactive elements reachable

### Test 13.2: Escape Key
- [ ] Open any modal
- [ ] Press Escape
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Focus returns to trigger

### Test 13.3: Enter Key
- [ ] Focus on form input
- [ ] Press Enter
- [ ] **Expected**: Form submits
- [ ] **Expected**: Action performed

### Test 13.4: Screen Reader Compatibility
- [ ] Enable screen reader
- [ ] Navigate application
- [ ] **Expected**: Elements announced correctly
- [ ] **Expected**: ARIA labels respected

### Test 13.5: Color Contrast
- [ ] Check all text colors
- [ ] **Expected**: Sufficient contrast ratio
- [ ] **Expected**: Text readable

### Test 13.6: Status Not Color-Only
- [ ] Check status indicators
- [ ] **Expected**: Icons used with colors
- [ ] **Expected**: Status understandable without color

### Test 13.7: Focus Indicators
- [ ] Tab through elements
- [ ] **Expected**: Focus clearly visible
- [ ] **Expected**: Focus indicator follows logical order

---

## Modal System Tests

### Test 14.1: Custom Alert Modal
- [ ] Trigger alert (e.g., empty order)
- [ ] **Expected**: Custom modal shown
- [ ] **Expected**: Title and message displayed
- [ ] **Expected**: OK button functional
- [ ] **Expected**: No browser alert used

### Test 14.2: Custom Confirm Modal
- [ ] Trigger confirm (e.g., payment)
- [ ] **Expected**: Custom modal shown
- [ ] **Expected**: Title and message displayed
- [ ] **Expected**: Confirm and Cancel buttons functional
- [ ] **Expected**: No browser confirm used

### Test 14.3: Custom Prompt Modal
- [ ] Trigger prompt (if implemented)
- [ ] **Expected**: Custom modal shown
- [ ] **Expected**: Input field functional
- [ ] **Expected**: Validation on submit
- [ ] **Expected**: No browser prompt used

### Test 14.4: Loading Modal
- [ ] Trigger loading state
- [ ] **Expected**: Loading modal shown
- [ ] **Expected**: Spinner displayed
- [ ] **Expected**: Message displayed
- [ ] **Expected**: Background dimmed

### Test 14.5: Modal Backdrop Click
- [ ] Open any modal
- [ ] Click outside modal content
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Action cancelled

### Test 14.6: Modal Close Button
- [ ] Open any modal
- [ ] Click X button
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Action cancelled

---

## Settings Tests

### Test 15.1: View Settings
- [ ] Login as admin
- [ ] Navigate to Settings section
- [ ] **Expected**: Current settings displayed
- [ ] **Expected**: All fields populated

### Test 15.2: Update Café Name
- [ ] Login as admin
- [ ] Change café name
- [ ] Click "Save"
- [ ] **Expected**: Settings saved
- [ ] **Expected**: Name updated in UI
- [ ] **Expected**: Audit log entry created

### Test 15.3: Update VAT Rate
- [ ] Login as admin
- [ ] Change VAT rate
- [ ] Click "Save"
- [ ] **Expected**: Settings saved
- [ ] **Expected**: New rate applied to new orders
- [ ] **Expected**: Audit log entry created

### Test 15.4: Update Service Charge Rate
- [ ] Login as admin
- [ ] Change service charge rate
- [ ] Click "Save"
- [ ] **Expected**: Settings saved
- [ ] **Expected**: New rate applied to new orders
- [ ] **Expected**: Audit log entry created

### Test 15.5: Update Receipt Footer
- [ ] Login as admin
- [ ] Change receipt footer
- [ ] Click "Save"
- [ ] **Expected**: Settings saved
- [ ] **Expected**: Footer updated on receipts
- [ ] **Expected**: Audit log entry created

### Test 15.6: Reset Settings to Defaults
- [ ] Login as admin
- [ ] Click "Reset to Defaults"
- [ ] Confirm action
- [ ] **Expected**: Settings reset
- [ ] **Expected**: Default values applied
- [ ] **Expected**: Audit log entry created

---

## Cross-Browser Tests

### Test 16.1: Chrome
- [ ] Run all critical tests in Chrome
- [ ] **Expected**: All tests pass
- [ ] **Expected**: No console errors

### Test 16.2: Firefox
- [ ] Run all critical tests in Firefox
- [ ] **Expected**: All tests pass
- [ ] **Expected**: No console errors

### Test 16.3: Safari
- [ ] Run all critical tests in Safari
- [ ] **Expected**: All tests pass
- [ ] **Expected**: No console errors

### Test 16.4: Edge
- [ ] Run all critical tests in Edge
- [ ] **Expected**: All tests pass
- [ ] **Expected**: No console errors

---

## Performance Tests

### Test 17.1: Large Menu
- [ ] Add 50+ products to menu
- [ ] Navigate menu
- [ ] **Expected**: No significant lag
- [ ] **Expected**: Smooth scrolling

### Test 17.2: Many Orders
- [ ] Create 50+ orders
- [ ] View orders list
- [ ] **Expected**: No significant lag
- [ ] **Expected**: Smooth scrolling

### Test 17.3: Many Audit Logs
- [ ] Generate 100+ audit log entries
- [ ] View audit logs
- [ ] **Expected**: No significant lag
- [ ] **Expected**: Smooth scrolling

---

## Error Recovery Tests

### Test 18.1: Network Error (if backend added)
- [ ] Simulate network error
- [ ] Try to perform action
- [ ] **Expected**: Error message displayed
- [ ] **Expected**: App remains functional
- [ ] **Expected**: Data not corrupted

### Test 18.2: Storage Quota Exceeded
- [ ] Fill localStorage to capacity
- [ ] Try to add data
- [ ] **Expected**: Error message displayed
- [ ] **Expected**: Graceful degradation

---

## Final Checklist

Before deploying to production:

- [ ] All critical tests pass
- [ ] All accessibility tests pass
- [ ] All responsive layout tests pass
- [ ] Cross-browser testing complete
- [ ] Performance acceptable
- [ ] Error handling verified
- [ ] Documentation complete
- [ ] Demo accounts working
- [ ] Audit logging functional
- [ ] Data model verified
- [ ] No console errors
- [ ] No security vulnerabilities (for current implementation)
- [ ] BACKEND_MIGRATION.md reviewed
- [ ] Known limitations documented

---

## Test Results Summary

| Test Category | Total Tests | Passed | Failed | Notes |
|---------------|-------------|--------|--------|-------|
| Authentication | 7 | | | |
| Access Control | 4 | | | |
| Order Creation | 11 | | | |
| Table Assignment | 5 | | | |
| Kitchen Status | 7 | | | |
| Checkout | 10 | | | |
| Receipt Printing | 3 | | | |
| Menu Availability | 8 | | | |
| Reports | 9 | | | |
| Responsive Layout | 6 | | | |
| Refresh Persistence | 5 | | | |
| Invalid Data Handling | 6 | | | |
| Accessibility | 7 | | | |
| Modal System | 6 | | | |
| Settings | 6 | | | |
| Cross-Browser | 4 | | | |
| Performance | 3 | | | |
| Error Recovery | 2 | | | |
| **TOTAL** | **99** | | | |

---

## Notes

- Document any issues found during testing
- Note any browser-specific behaviors
- Record any performance concerns
- Suggest any improvements
