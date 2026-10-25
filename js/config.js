// Configuration constants
const CONFIG = {
  STORAGE_KEYS: {
    ORDERS: 'cafe_orders',
    MENU: 'cafe_menu',
    USER: 'cafe_user',
    CATEGORIES: 'cafe_categories',
    KITCHEN_NOTE: 'kitchenNote',
    SPLIT_BILLS: 'cafe_split_bills',
    TABLE_HISTORY: 'cafe_table_history',
    DISCOUNT_LOGS: 'cafe_discount_logs',
    PAYMENTS: 'cafe_payments',
    RECEIPTS: 'cafe_receipts',
    AUDIT_LOG: 'cafe_audit_log',
    REFUNDS: 'cafe_refunds',
    DAILY_REPORTS: 'cafe_daily_reports'
  },
  TABLE_COUNT: 10,
  CURRENCY: 'NPR',
  VAT_INCLUDED: true,
  VAT_RATE: 0.13,
  SERVICE_CHARGE_RATE: 0.10,
  MAX_DISCOUNT_PERCENT: 15,
  MAX_DISCOUNT_AMOUNT: 500,
  PAYMENT_METHODS: ['cash', 'card', 'mobile', 'mixed']
};