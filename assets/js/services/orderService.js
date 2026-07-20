// Order Service - Abstracts order operations from localStorage
// This service will be replaced with Supabase operations in the future

const OrderService = {
    // Get all orders
    getAllOrders: function() {
        try {
            if (typeof StorageService !== 'undefined' && StorageService.getOrders) {
                return StorageService.getOrders();
            }
            return JSON.parse(localStorage.getItem('cafe_orders') || '[]');
        } catch (error) {
            console.error('Get orders error:', error);
            return [];
        }
    },

    // Get order by ID
    getOrderById: function(orderId) {
        try {
            const orders = this.getAllOrders();
            return orders.find(o => o.id === orderId);
        } catch (error) {
            console.error('Get order by ID error:', error);
            return null;
        }
    },

    // Create new order
    createOrder: function(orderData) {
        try {
            const orders = this.getAllOrders();
            
            // Generate order number
            const orderNumber = typeof StorageService !== 'undefined' && StorageService.generateOrderNumber
                ? StorageService.generateOrderNumber()
                : Date.now().toString();

            const newOrder = {
                id: 'o_' + Date.now(),
                orderNumber: orderNumber,
                businessDate: new Date().toISOString().split('T')[0],
                tableId: orderData.tableId,
                orderType: orderData.orderType || 'dinein',
                status: orderData.status || 'draft',
                waiterId: orderData.waiterId,
                items: (orderData.items || []).map(item => ({
                    productId: item.id,
                    productName: item.name,
                    unitPrice: item.price,
                    quantity: item.quantity,
                    itemNote: item.note || '',
                    lineTotal: item.price * item.quantity
                })),
                subtotal: orderData.subtotal || 0,
                VAT: orderData.vat || 0,
                serviceCharge: orderData.serviceCharge || 0,
                discount: orderData.discount || 0,
                tip: orderData.tip || 0,
                total: orderData.total || 0,
                notes: orderData.notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                statusHistory: [{
                    status: orderData.status || 'draft',
                    timestamp: new Date().toISOString(),
                    userId: orderData.waiterId || 'system'
                }]
            };

            orders.push(newOrder);

            if (typeof StorageService !== 'undefined' && StorageService.setOrders) {
                StorageService.setOrders(orders);
            } else {
                localStorage.setItem('cafe_orders', JSON.stringify(orders));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: orderData.waiterId || 'system',
                    action: 'order_created',
                    entityType: 'order',
                    entityId: newOrder.id,
                    description: `Order created for ${orderData.orderType === 'dinein' ? 'Table ' + orderData.tableId : 'Take Away'}`
                });
            }

            return { success: true, order: newOrder };
        } catch (error) {
            console.error('Create order error:', error);
            return { success: false, error: 'Failed to create order' };
        }
    },

    // Update order
    updateOrder: function(orderId, updates) {
        try {
            const orders = this.getAllOrders();
            const index = orders.findIndex(o => o.id === orderId);
            
            if (index === -1) {
                return { success: false, error: 'Order not found' };
            }

            const oldStatus = orders[index].status;
            orders[index] = { 
                ...orders[index], 
                ...updates, 
                updatedAt: new Date().toISOString() 
            };

            // Add status history if status changed
            if (updates.status && updates.status !== oldStatus) {
                orders[index].statusHistory = orders[index].statusHistory || [];
                orders[index].statusHistory.push({
                    status: updates.status,
                    timestamp: new Date().toISOString(),
                    userId: updates.userId || 'system'
                });

                // Add audit log for status change
                if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                    StorageService.addAuditLog({
                        userId: updates.userId || 'system',
                        action: 'status_changed',
                        entityType: 'order',
                        entityId: orderId,
                        description: `Order status changed from ${oldStatus} to ${updates.status}`
                    });
                }
            }

            if (typeof StorageService !== 'undefined' && StorageService.setOrders) {
                StorageService.setOrders(orders);
            } else {
                localStorage.setItem('cafe_orders', JSON.stringify(orders));
            }

            return { success: true, order: orders[index] };
        } catch (error) {
            console.error('Update order error:', error);
            return { success: false, error: 'Failed to update order' };
        }
    },

    // Cancel order
    cancelOrder: function(orderId, reason, userId) {
        try {
            const result = this.updateOrder(orderId, {
                status: 'cancelled',
                cancelReason: reason,
                cancelledAt: new Date().toISOString(),
                userId: userId
            });

            if (result.success) {
                // Add audit log
                if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                    StorageService.addAuditLog({
                        userId: userId || 'system',
                        action: 'order_cancelled',
                        entityType: 'order',
                        entityId: orderId,
                        description: `Order cancelled: ${reason}`
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('Cancel order error:', error);
            return { success: false, error: 'Failed to cancel order' };
        }
    },

    // Get today's orders
    getTodaysOrders: function() {
        try {
            const orders = this.getAllOrders();
            const today = new Date().toISOString().split('T')[0];
            return orders.filter(o => o.businessDate === today);
        } catch (error) {
            console.error('Get today\'s orders error:', error);
            return [];
        }
    },

    // Get orders by status
    getOrdersByStatus: function(status) {
        try {
            const orders = this.getAllOrders();
            return orders.filter(o => o.status === status);
        } catch (error) {
            console.error('Get orders by status error:', error);
            return [];
        }
    },

    // Get orders by table
    getOrdersByTable: function(tableId) {
        try {
            const orders = this.getAllOrders();
            return orders.filter(o => o.tableId === tableId && o.status !== 'paid' && o.status !== 'cancelled');
        } catch (error) {
            console.error('Get orders by table error:', error);
            return [];
        }
    },

    // Get orders by waiter
    getOrdersByWaiter: function(waiterId) {
        try {
            const orders = this.getAllOrders();
            return orders.filter(o => o.waiterId === waiterId);
        } catch (error) {
            console.error('Get orders by waiter error:', error);
            return [];
        }
    },

    // Process payment
    processPayment: function(orderId, paymentData) {
        try {
            const result = this.updateOrder(orderId, {
                status: 'paid',
                paymentMethod: paymentData.paymentMethod,
                tip: paymentData.tip || 0,
                amountReceived: paymentData.amountReceived,
                changeDue: paymentData.changeDue,
                paidAt: new Date().toISOString(),
                userId: paymentData.userId
            });

            if (result.success) {
                // Add audit log
                if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                    StorageService.addAuditLog({
                        userId: paymentData.userId || 'system',
                        action: 'payment_completed',
                        entityType: 'order',
                        entityId: orderId,
                        description: `Payment completed via ${paymentData.paymentMethod} - NPR ${paymentData.amountPaid.toFixed(0)}`
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('Process payment error:', error);
            return { success: false, error: 'Failed to process payment' };
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OrderService };
}
