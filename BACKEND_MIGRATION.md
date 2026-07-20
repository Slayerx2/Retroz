# Backend Migration Guide: LocalStorage to Supabase

## Why LocalStorage is Not Production-Safe

LocalStorage has several critical limitations that make it unsuitable for production use:

1. **Data Loss on Clear**: Users can clear browser data, losing all orders, menu items, and settings
2. **No Synchronization**: Data is isolated to a single browser/device - no multi-device support
3. **No Backup**: No automatic backups or version history
4. **Security Risks**: Data stored in plain text, accessible via browser console
5. **Storage Limits**: Typically limited to 5-10MB per domain
6. **No Real-time Updates**: Changes don't sync across multiple users/devices
7. **No Server-Side Validation**: All validation happens client-side, bypassable
8. **No Audit Trail**: Limited audit logging capabilities
9. **Scalability Issues**: Cannot handle high-concurrency scenarios
10. **No Offline Sync**: No conflict resolution for offline changes

## Proposed Supabase Tables

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'waiter', 'cook')),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
```

### Tables Table
```sql
CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    capacity INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tables_enabled ON tables(enabled);
```

### Categories Table
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id),
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url TEXT,
    vegetarian BOOLEAN DEFAULT false,
    preparation_time INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_products_archived ON products(archived);
```

### Orders Table
```sql
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    business_date DATE NOT NULL,
    table_id INTEGER REFERENCES tables(id),
    order_type TEXT NOT NULL CHECK (order_type IN ('dinein', 'takeaway')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'preparing', 'ready', 'completed', 'paid', 'cancelled')),
    waiter_id UUID REFERENCES users(id),
    subtotal DECIMAL(10, 2) DEFAULT 0,
    vat DECIMAL(10, 2) DEFAULT 0,
    service_charge DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    tip DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT
);

CREATE INDEX idx_orders_business_date ON orders(business_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name TEXT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    item_note TEXT,
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### Order Status History Table
```sql
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_timestamp ON order_status_history(timestamp);
```

### Payments Table
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile')),
    amount DECIMAL(10, 2) NOT NULL,
    tip DECIMAL(10, 2) DEFAULT 0,
    amount_received DECIMAL(10, 2),
    change_due DECIMAL(10, 2),
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### Announcements Table
```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('kitchen', 'waiter')),
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_announcements_type ON announcements(type);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### Settings Table
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_name TEXT NOT NULL DEFAULT 'CaféPOS',
    address TEXT,
    phone TEXT,
    currency TEXT DEFAULT 'NPR',
    vat_rate DECIMAL(5, 2) DEFAULT 13.00,
    service_charge_rate DECIMAL(5, 2) DEFAULT 10.00,
    receipt_footer TEXT DEFAULT 'Thank you for dining with us!',
    kitchen_warning_time INTEGER DEFAULT 10,
    kitchen_delay_time INTEGER DEFAULT 20,
    theme TEXT DEFAULT 'light',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Authentication Flow

### 1. User Login
```
Client → Supabase Auth (signInWithPassword)
         ↓
    JWT Token returned
         ↓
    Token stored in localStorage
         ↓
    Token sent with each request
         ↓
    Supabase validates token
         ↓
    Request processed if valid
```

### 2. Session Management
- Use Supabase Auth for session management
- Implement token refresh automatically
- Store session in localStorage with expiration
- Handle session expiration gracefully

### 3. Password Security
- Use Supabase Auth's built-in password hashing
- Never store plain text passwords
- Implement password strength requirements
- Support password reset via Supabase Auth

## Role-Based Access Control

### Row-Level Security (RLS) Policies

### Users Table RLS
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins can read all users
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Users can only read their own data
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Only admins can insert/update users
CREATE POLICY "Only admins can manage users"
ON users FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

### Orders Table RLS
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Waiters can read orders they created
CREATE POLICY "Waiters can read own orders"
ON orders FOR SELECT
TO authenticated
USING (waiter_id = auth.uid());

-- Cooks can read all active orders
CREATE POLICY "Cooks can read active orders"
ON orders FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'cook' AND status IN ('sent', 'preparing', 'ready'));

-- Admins can read all orders
CREATE POLICY "Admins can read all orders"
ON orders FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Waiters can create orders
CREATE POLICY "Waiters can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (waiter_id = auth.uid());

-- Waiters can update orders they created
CREATE POLICY "Waiters can update own orders"
ON orders FOR UPDATE
TO authenticated
USING (waiter_id = auth.uid());

-- Cooks can update order status
CREATE POLICY "Cooks can update order status"
ON orders FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'cook' AND status IN ('sent', 'preparing'));
```

### Products Table RLS
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read available products
CREATE POLICY "Authenticated users can read available products"
ON products FOR SELECT
TO authenticated
USING (available = true AND archived = false);

-- Admins can read all products
CREATE POLICY "Admins can read all products"
ON products FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can manage products
CREATE POLICY "Only admins can manage products"
ON products FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

## Real-Time Order Subscriptions

### Kitchen Display Real-Time Updates
```javascript
// Subscribe to new and preparing orders
const subscription = supabase
    .channel('kitchen-orders')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `status=in.('sent','preparing','ready')`
        },
        (payload) => {
            // Update kitchen display
            handleOrderUpdate(payload.new);
        }
    )
    .subscribe();
```

### Waiter Real-Time Updates
```javascript
// Subscribe to order status changes
const subscription = supabase
    .channel('waiter-orders')
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `waiter_id=eq.${userId}`
        },
        (payload) => {
            // Update waiter display
            handleOrderStatusChange(payload.new);
        }
    )
    .subscribe();
```

### Admin Real-Time Updates
```javascript
// Subscribe to all order changes
const subscription = supabase
    .channel('admin-orders')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'orders'
        },
        (payload) => {
            // Update admin dashboard
            handleOrderChange(payload);
        }
    )
    .subscribe();
```

## Storage for Product Images

### Supabase Storage Setup
1. Create a storage bucket named `product-images`
2. Configure bucket policies:
   - Public read access for product images
   - Authenticated write access for admins
   - File size limit: 5MB per image
   - Allowed formats: jpg, jpeg, png, webp

### Image Upload Flow
```javascript
async function uploadProductImage(file, productId) {
    const fileName = `${productId}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
    
    // Update product with image URL
    await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId);
    
    return publicUrl;
}
```

## Migration Steps from Local Data to Supabase

### Phase 1: Preparation
1. **Backup Local Data**
   - Export all localStorage data to JSON files
   - Verify data integrity
   - Create backup of existing localStorage

2. **Supabase Project Setup**
   - Create new Supabase project
   - Configure database schema
   - Set up storage buckets
   - Configure authentication providers

### Phase 2: Schema Migration
1. **Create Tables**
   - Run SQL migration scripts
   - Create indexes for performance
   - Set up foreign key constraints

2. **Configure RLS**
   - Enable Row-Level Security
   - Create security policies
   - Test policies with different roles

3. **Seed Initial Data**
   - Import default categories
   - Import default products
   - Create default tables
   - Create admin user

### Phase 3: Data Migration
1. **Migrate Users**
   ```javascript
   async function migrateUsers() {
       const localUsers = JSON.parse(localStorage.getItem('cafe_users') || '[]');
       
       for (const user of localUsers) {
           const { data, error } = await supabase.auth.signUp({
               email: `${user.username}@cafe.local`, // Temporary email
               password: user.password,
               options: {
                   data: {
                       username: user.username,
                       role: user.role
                   }
               }
           });
           
           if (error) console.error('Failed to migrate user:', user.username, error);
       }
   }
   ```

2. **Migrate Products**
   ```javascript
   async function migrateProducts() {
       const localProducts = JSON.parse(localStorage.getItem('cafe_menu') || '[]');
       
       const { data, error } = await supabase
           .from('products')
           .insert(localProducts.map(p => ({
               name: p.name,
               category_id: p.category,
               price: p.price,
               description: p.desc,
               image_url: p.img,
               vegetarian: p.vegetarian,
               preparation_time: p.prepTime,
               available: p.available,
               archived: p.archived
           })));
       
       if (error) console.error('Failed to migrate products:', error);
   }
   ```

3. **Migrate Orders**
   ```javascript
   async function migrateOrders() {
       const localOrders = JSON.parse(localStorage.getItem('cafe_orders') || '[]');
       
       for (const order of localOrders) {
           // Insert order
           const { data: orderData, error: orderError } = await supabase
               .from('orders')
               .insert({
                   id: order.id,
                   order_number: order.orderNumber || order.id.replace('o_', ''),
                   business_date: order.businessDate || new Date(order.createdAt).toISOString().split('T')[0],
                   table_id: order.table,
                   order_type: order.orderType,
                   status: order.status,
                   waiter_id: await getUserIdByUsername(order.waiter),
                   subtotal: order.subtotal,
                   vat: order.vat,
                   service_charge: order.serviceCharge,
                   discount: order.discount,
                   tip: order.tip,
                   total: order.total,
                   notes: order.note,
                   created_at: order.createdAt,
                   updated_at: order.updatedAt,
                   paid_at: order.paidAt,
                   cancelled_at: order.cancelledAt,
                   cancel_reason: order.cancelReason
               })
               .select()
               .single();
           
           if (orderError) {
               console.error('Failed to migrate order:', order.id, orderError);
               continue;
           }
           
           // Insert order items with snapshots
           for (const item of order.items) {
               await supabase.from('order_items').insert({
                   order_id: order.id,
                   product_id: item.id,
                   product_name: item.name,
                   unit_price: item.price,
                   quantity: item.quantity,
                   item_note: item.note,
                   line_total: item.price * item.quantity
               });
           }
           
           // Insert status history
           if (order.statusHistory) {
               for (const history of order.statusHistory) {
                   await supabase.from('order_status_history').insert({
                       order_id: order.id,
                       status: history.status,
                       user_id: await getUserIdByUsername(history.userId),
                       timestamp: history.timestamp,
                       reason: history.reason
                   });
               }
           }
       }
   }
   ```

4. **Migrate Settings**
   ```javascript
   async function migrateSettings() {
       const localSettings = JSON.parse(localStorage.getItem('cafe_settings') || '{}');
       
       const { data, error } = await supabase
           .from('settings')
           .upsert({
               cafe_name: localSettings.cafeName,
               address: localSettings.address,
               phone: localSettings.phone,
               currency: localSettings.currency,
               vat_rate: localSettings.vatRate,
               service_charge_rate: localSettings.serviceChargeRate,
               receipt_footer: localSettings.receiptFooter,
               kitchen_warning_time: localSettings.kitchenWarningTime,
               kitchen_delay_time: localSettings.kitchenDelayTime,
               theme: localSettings.theme
           });
       
       if (error) console.error('Failed to migrate settings:', error);
   }
   ```

### Phase 4: Frontend Integration
1. **Update Service Modules**
   - Replace localStorage calls with Supabase client calls
   - Update authentication to use Supabase Auth
   - Implement real-time subscriptions
   - Handle Supabase errors gracefully

2. **Update UI Components**
   - Add loading states for Supabase operations
   - Implement error handling and retry logic
   - Add offline detection and handling
   - Update forms to work with Supabase

3. **Testing**
   - Test all CRUD operations
   - Test real-time updates
   - Test authentication flow
   - Test RLS policies
   - Test error scenarios

### Phase 5: Cleanup
1. **Remove LocalStorage Dependencies**
   - Remove old localStorage keys
   - Clean up migration code
   - Update documentation

2. **Data Validation**
   - Verify all data migrated correctly
   - Check for data integrity
   - Validate relationships

3. **Performance Optimization**
   - Add database indexes
   - Optimize queries
   - Implement caching where appropriate

## Rollback Plan

If migration fails:
1. Keep localStorage as backup
2. Provide fallback to localStorage mode
3. Document migration errors
4. Plan retry strategy

## Security Considerations

1. **Environment Variables**
   - Store Supabase URL and anon key in environment variables
   - Never commit secrets to version control
   - Use different keys for development and production

2. **API Security**
   - Enable Supabase API rate limiting
   - Implement request validation
   - Use HTTPS only

3. **Data Privacy**
   - Comply with data protection regulations
   - Implement data retention policies
   - Provide data export functionality

## Performance Optimization

1. **Database Indexes**
   - Add indexes on frequently queried columns
   - Monitor query performance
   - Optimize slow queries

2. **Caching Strategy**
   - Cache frequently accessed data
   - Implement cache invalidation
   - Use Supabase edge functions for complex queries

3. **Real-Time Optimization**
   - Filter subscriptions to reduce bandwidth
   - Debounce rapid updates
   - Implement connection pooling

## Monitoring and Maintenance

1. **Logging**
   - Implement structured logging
   - Monitor API errors
   - Track performance metrics

2. **Alerts**
   - Set up error rate alerts
   - Monitor database performance
   - Track authentication failures

3. **Backups**
   - Enable automatic Supabase backups
   - Test restore procedures
   - Document backup retention policy
