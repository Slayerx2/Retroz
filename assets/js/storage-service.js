// Structured Storage Service - Versioned LocalStorage Management

const STORAGE_VERSION = '1.0.0';
const STORAGE_PREFIX = 'cafe_v1_';

// Storage keys
const STORAGE_KEYS = {
    USERS: STORAGE_PREFIX + 'users',
    SESSION: STORAGE_PREFIX + 'session',
    SETTINGS: STORAGE_PREFIX + 'settings',
    TABLES: STORAGE_PREFIX + 'tables',
    CATEGORIES: STORAGE_PREFIX + 'categories',
    PRODUCTS: STORAGE_PREFIX + 'products',
    ORDERS: STORAGE_PREFIX + 'orders',
    ORDER_ITEMS: STORAGE_PREFIX + 'order_items',
    PAYMENTS: STORAGE_PREFIX + 'payments',
    ANNOUNCEMENTS: STORAGE_PREFIX + 'announcements',
    AUDIT_LOGS: STORAGE_PREFIX + 'audit_logs',
    SCHEMA_VERSION: STORAGE_PREFIX + 'schema_version'
};

// Safe JSON parsing with fallback defaults
function safeParse(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        if (value === null || value === 'undefined') {
            return defaultValue;
        }
        return JSON.parse(value);
    } catch (e) {
        console.error(`Error parsing ${key}:`, e);
        return defaultValue;
    }
}

// Safe JSON storage
function safeSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Error setting ${key}:`, e);
        return false;
    }
}

// Schema migration function
function migrateSchema() {
    const currentVersion = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    
    if (currentVersion === STORAGE_VERSION) {
        return; // Already on current version
    }

    console.log('Migrating schema from', currentVersion, 'to', STORAGE_VERSION);

    // Migration from old format to new format
    if (!currentVersion) {
        // Migrate old orders to new format
        const oldOrders = safeParse('cafe_orders', []);
        const newOrders = oldOrders.map(order => normalizeOrder(order));
        safeSet(STORAGE_KEYS.ORDERS, newOrders);

        // Migrate old menu to new products
        const oldMenu = safeParse('cafe_menu', []);
        const newProducts = oldMenu.map(item => normalizeProduct(item));
        safeSet(STORAGE_KEYS.PRODUCTS, newProducts);

        // Migrate old settings
        const oldSettings = safeParse('cafe_settings', {});
        safeSet(STORAGE_KEYS.SETTINGS, normalizeSettings(oldSettings));

        // Migrate old tables
        const oldTables = safeParse('cafe_tables', []);
        const newTables = oldTables.map(table => normalizeTable(table));
        safeSet(STORAGE_KEYS.TABLES, newTables);

        // Clean up old keys
        localStorage.removeItem('cafe_orders');
        localStorage.removeItem('cafe_menu');
        localStorage.removeItem('cafe_settings');
        localStorage.removeItem('cafe_tables');
    }

    // Set current version
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, STORAGE_VERSION);
}

// Normalize order to new schema
function normalizeOrder(order) {
    const now = new Date().toISOString();
    return {
        id: order.id || generateId('o_'),
        orderNumber: order.orderNumber || order.id?.replace('o_', '') || generateOrderNumber(),
        businessDate: order.businessDate || new Date().toISOString().split('T')[0],
        tableId: order.tableId || order.table,
        orderType: order.orderType || 'dinein',
        status: order.status || 'draft',
        waiterId: order.waiterId || order.waiter,
        items: (order.items || []).map(item => normalizeOrderItem(item)),
        subtotal: order.subtotal || 0,
        VAT: order.vat || 0,
        serviceCharge: order.serviceCharge || 0,
        discount: order.discount || 0,
        tip: order.tip || 0,
        total: order.total || 0,
        notes: order.note || '',
        createdAt: order.createdAt || now,
        updatedAt: order.updatedAt || now,
        statusHistory: order.statusHistory || [{
            status: order.status || 'draft',
            timestamp: now,
            userId: order.waiterId || order.waiter || 'system'
        }]
    };
}

// Normalize order item with snapshot
function normalizeOrderItem(item) {
    return {
        productId: item.id,
        productName: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        itemNote: item.note || '',
        lineTotal: item.price * item.quantity
    };
}

// Normalize product
function normalizeProduct(product) {
    return {
        id: product.id,
        name: product.name,
        category: product.category || 'other',
        price: product.price,
        description: product.desc || '',
        imageUrl: product.img || '',
        vegetarian: product.vegetarian || false,
        preparationTime: product.prepTime || 0,
        available: product.available !== false,
        archived: product.archived || false,
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: product.updatedAt || new Date().toISOString()
    };
}

// Normalize settings
function normalizeSettings(settings) {
    return {
        cafeName: settings.cafeName || 'CaféPOS',
        address: settings.address || '',
        phone: settings.phone || '',
        currency: settings.currency || 'NPR',
        vatRate: settings.vatRate || 13,
        serviceChargeRate: settings.serviceChargeRate || 10,
        receiptFooter: settings.receiptFooter || 'Thank you for dining with us!',
        kitchenWarningTime: settings.kitchenWarningTime || 10,
        kitchenDelayTime: settings.kitchenDelayTime || 20,
        theme: settings.theme || 'light'
    };
}

// Normalize table
function normalizeTable(table) {
    return {
        id: table.id,
        name: table.name,
        enabled: table.enabled !== false,
        capacity: table.capacity || 4
    };
}

// Generate unique ID
function generateId(prefix = '') {
    return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate order number
function generateOrderNumber() {
    const today = new Date();
    const dateStr = today.getFullYear().toString().substr(2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const orders = getOrders();
    const todayOrders = orders.filter(o => o.orderNumber?.startsWith(dateStr));
    const sequence = (todayOrders.length + 1).toString().padStart(4, '0');
    return dateStr + sequence;
}

// Storage service API
const StorageService = {
    // Users
    getUsers: () => safeParse(STORAGE_KEYS.USERS, []),
    setUsers: (users) => safeSet(STORAGE_KEYS.USERS, users),
    getUser: (id) => {
        const users = StorageService.getUsers();
        return users.find(u => u.id === id);
    },

    // Session
    getSession: () => safeParse(STORAGE_KEYS.SESSION, null),
    setSession: (session) => safeSet(STORAGE_KEYS.SESSION, session),
    clearSession: () => localStorage.removeItem(STORAGE_KEYS.SESSION),

    // Settings
    getSettings: () => safeParse(STORAGE_KEYS.SETTINGS, normalizeSettings({})),
    setSettings: (settings) => safeSet(STORAGE_KEYS.SETTINGS, normalizeSettings(settings)),

    // Tables
    getTables: () => safeParse(STORAGE_KEYS.TABLES, []),
    setTables: (tables) => safeSet(STORAGE_KEYS.TABLES, tables),
    getTable: (id) => {
        const tables = StorageService.getTables();
        return tables.find(t => t.id === id);
    },

    // Categories
    getCategories: () => safeParse(STORAGE_KEYS.CATEGORIES, [
        { id: 'veg', name: 'Vegetarian', order: 1 },
        { id: 'non-veg', name: 'Non-Vegetarian', order: 2 },
        { id: 'snacks', name: 'Snacks', order: 3 },
        { id: 'drinks', name: 'Drinks', order: 4 },
        { id: 'bakery', name: 'Bakery & Sweets', order: 5 }
    ]),
    setCategories: (categories) => safeSet(STORAGE_KEYS.CATEGORIES, categories),

    // Products (Menu)
    getProducts: () => safeParse(STORAGE_KEYS.PRODUCTS, []),
    setProducts: (products) => safeSet(STORAGE_KEYS.PRODUCTS, products),
    getProduct: (id) => {
        const products = StorageService.getProducts();
        return products.find(p => p.id === id);
    },
    getAvailableProducts: () => {
        const products = StorageService.getProducts();
        return products.filter(p => p.available && !p.archived);
    },

    // Orders
    getOrders: () => safeParse(STORAGE_KEYS.ORDERS, []),
    setOrders: (orders) => safeSet(STORAGE_KEYS.ORDERS, orders),
    getOrder: (id) => {
        const orders = StorageService.getOrders();
        return orders.find(o => o.id === id);
    },
    addOrder: (order) => {
        const orders = StorageService.getOrders();
        const normalizedOrder = normalizeOrder(order);
        orders.push(normalizedOrder);
        StorageService.setOrders(orders);
        return normalizedOrder;
    },
    updateOrder: (id, updates) => {
        const orders = StorageService.getOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
            StorageService.setOrders(orders);
            return orders[index];
        }
        return null;
    },
    getTodaysOrders: () => {
        const orders = StorageService.getOrders();
        const today = new Date().toISOString().split('T')[0];
        return orders.filter(o => o.businessDate === today);
    },

    // Order Items (stored separately for better organization)
    getOrderItems: (orderId) => {
        const allItems = safeParse(STORAGE_KEYS.ORDER_ITEMS, []);
        return allItems.filter(item => item.orderId === orderId);
    },
    addOrderItems: (items) => {
        const allItems = safeParse(STORAGE_KEYS.ORDER_ITEMS, []);
        allItems.push(...items);
        safeSet(STORAGE_KEYS.ORDER_ITEMS, allItems);
    },

    // Payments
    getPayments: () => safeParse(STORAGE_KEYS.PAYMENTS, []),
    setPayments: (payments) => safeSet(STORAGE_KEYS.PAYMENTS, payments),
    addPayment: (payment) => {
        const payments = StorageService.getPayments();
        payments.push(payment);
        StorageService.setPayments(payments);
        return payment;
    },
    getPaymentsForOrder: (orderId) => {
        const payments = StorageService.getPayments();
        return payments.filter(p => p.orderId === orderId);
    },

    // Announcements
    getAnnouncements: () => safeParse(STORAGE_KEYS.ANNOUNCEMENTS, []),
    setAnnouncements: (announcements) => safeSet(STORAGE_KEYS.ANNOUNCEMENTS, announcements),
    getKitchenAnnouncement: () => {
        const announcements = StorageService.getAnnouncements();
        const kitchen = announcements.find(a => a.type === 'kitchen');
        return kitchen ? kitchen.content : '';
    },
    setKitchenAnnouncement: (content) => {
        const announcements = StorageService.getAnnouncements();
        const index = announcements.findIndex(a => a.type === 'kitchen');
        if (index !== -1) {
            announcements[index].content = content;
            announcements[index].updatedAt = new Date().toISOString();
        } else {
            announcements.push({
                id: generateId('a_'),
                type: 'kitchen',
                content: content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        StorageService.setAnnouncements(announcements);
    },

    // Audit Logs
    getAuditLogs: () => safeParse(STORAGE_KEYS.AUDIT_LOGS, []),
    addAuditLog: (log) => {
        const logs = StorageService.getAuditLogs();
        const auditLog = {
            id: generateId('log_'),
            userId: log.userId || 'system',
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            timestamp: new Date().toISOString(),
            description: log.description,
            metadata: log.metadata || {}
        };
        logs.push(auditLog);
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        safeSet(STORAGE_KEYS.AUDIT_LOGS, logs);
        return auditLog;
    },
    getAuditLogsForEntity: (entityType, entityId) => {
        const logs = StorageService.getAuditLogs();
        return logs.filter(l => l.entityType === entityType && l.entityId === entityId);
    },

    // Utility functions
    clearAll: () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    getStorageInfo: () => {
        const info = {};
        Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
            const value = localStorage.getItem(key);
            info[name] = {
                exists: value !== null,
                size: value ? value.length : 0
            };
        });
        return info;
    }
};

// Seed data function
function seedData() {
    // Check if data already exists
    const existingOrders = StorageService.getOrders();
    const existingProducts = StorageService.getProducts();
    const existingTables = StorageService.getTables();

    if (existingOrders.length > 0 || existingProducts.length > 0 || existingTables.length > 0) {
        console.log('Data already exists, skipping seed');
        return;
    }

    console.log('Seeding initial data...');

    // Seed users
    const users = [
        { id: 'u_1', username: 'admin', password: 'admin123', role: 'admin', active: true, createdAt: new Date().toISOString() },
        { id: 'u_2', username: 'waiter1', password: 'waiter123', role: 'waiter', active: true, createdAt: new Date().toISOString() },
        { id: 'u_3', username: 'waiter2', password: 'waiter123', role: 'waiter', active: true, createdAt: new Date().toISOString() },
        { id: 'u_4', username: 'cook1', password: 'cook123', role: 'cook', active: true, createdAt: new Date().toISOString() },
        { id: 'u_5', username: 'cook2', password: 'cook123', role: 'cook', active: true, createdAt: new Date().toISOString() }
    ];
    StorageService.setUsers(users);

    // Seed tables
    const tables = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Table ${i + 1}`,
        enabled: true,
        capacity: 4
    }));
    StorageService.setTables(tables);

    // Seed products
    const products = [
        { id: 1, name: 'Masala Tea', category: 'drinks', price: 45, description: 'Spiced Indian tea', vegetarian: true, preparationTime: 5, available: true },
        { id: 2, name: 'Coffee', category: 'drinks', price: 60, description: 'Fresh brewed coffee', vegetarian: true, preparationTime: 5, available: true },
        { id: 3, name: 'Samosa', category: 'snacks', price: 25, description: 'Crispy pastry with potato filling', vegetarian: true, preparationTime: 10, available: true },
        { id: 4, name: 'Chicken Momos', category: 'snacks', price: 120, description: 'Steamed dumplings with chicken', vegetarian: false, preparationTime: 15, available: true },
        { id: 5, name: 'Veg Momos', category: 'snacks', price: 80, description: 'Steamed vegetable dumplings', vegetarian: true, preparationTime: 15, available: true },
        { id: 6, name: 'Butter Chicken', category: 'non-veg', price: 280, description: 'Creamy chicken curry', vegetarian: false, preparationTime: 25, available: true },
        { id: 7, name: 'Paneer Tikka', category: 'veg', price: 220, description: 'Grilled cottage cheese', vegetarian: true, preparationTime: 20, available: true },
        { id: 8, name: 'Chocolate Cake', category: 'bakery', price: 150, description: 'Rich chocolate cake', vegetarian: true, preparationTime: 0, available: true },
        { id: 9, name: 'Gulab Jamun', category: 'bakery', price: 80, description: 'Sweet milk dumplings', vegetarian: true, preparationTime: 0, available: true },
        { id: 10, name: 'Fresh Juice', category: 'drinks', price: 70, description: 'Fresh fruit juice', vegetarian: true, preparationTime: 5, available: true }
    ].map(p => normalizeProduct(p));
    StorageService.setProducts(products);

    // Seed settings
    const settings = normalizeSettings({});
    StorageService.setSettings(settings);

    console.log('Seed data completed');
}

// Initialize storage service
function initializeStorage() {
    migrateSchema();
    seedData();
}

// Auto-initialize
initializeStorage();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageService, initializeStorage, seedData };
}
