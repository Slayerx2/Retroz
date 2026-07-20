// Report Service - Abstracts report operations from localStorage
// This service will be replaced with Supabase operations in the future

const ReportService = {
    // Get sales report for date range
    getSalesReport: function(startDate, endDate) {
        try {
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate;
            });

            const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const totalOrders = filteredOrders.length;
            const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
            const totalTips = filteredOrders.reduce((sum, o) => sum + (o.tip || 0), 0);
            const totalVAT = filteredOrders.reduce((sum, o) => sum + (o.VAT || 0), 0);
            const totalServiceCharge = filteredOrders.reduce((sum, o) => sum + (o.serviceCharge || 0), 0);
            const totalDiscount = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
            const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;

            return {
                totalSales,
                totalOrders,
                avgOrderValue,
                totalTips,
                totalVAT,
                totalServiceCharge,
                totalDiscount,
                cancelledOrders,
                orders: filteredOrders
            };
        } catch (error) {
            console.error('Get sales report error:', error);
            return null;
        }
    },

    // Get payment breakdown
    getPaymentBreakdown: function(startDate, endDate) {
        try {
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate && order.status === 'paid';
            });

            const breakdown = {
                cash: 0,
                card: 0,
                mobile: 0,
                total: 0
            };

            filteredOrders.forEach(order => {
                const method = order.paymentMethod || 'cash';
                if (breakdown[method] !== undefined) {
                    breakdown[method] += order.total || 0;
                }
                breakdown.total += order.total || 0;
            });

            return breakdown;
        } catch (error) {
            console.error('Get payment breakdown error:', error);
            return null;
        }
    },

    // Get product sales report
    getProductSales: function(startDate, endDate) {
        try {
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate;
            });

            const productSales = {};

            filteredOrders.forEach(order => {
                (order.items || []).forEach(item => {
                    const key = item.productName || item.name;
                    if (!productSales[key]) {
                        productSales[key] = {
                            name: key,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[key].quantity += item.quantity;
                    productSales[key].revenue += item.lineTotal || (item.price * item.quantity);
                });
            });

            return Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
        } catch (error) {
            console.error('Get product sales error:', error);
            return [];
        }
    },

    // Get waiter performance report
    getWaiterPerformance: function(startDate, endDate) {
        try {
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate;
            });

            const waiterStats = {};

            filteredOrders.forEach(order => {
                const waiter = order.waiterId || order.waiter || 'Unknown';
                if (!waiterStats[waiter]) {
                    waiterStats[waiter] = {
                        waiter,
                        orderCount: 0,
                        totalSales: 0,
                        totalTips: 0
                    };
                }
                waiterStats[waiter].orderCount++;
                waiterStats[waiter].totalSales += order.total || 0;
                waiterStats[waiter].totalTips += order.tip || 0;
            });

            return Object.values(waiterStats).sort((a, b) => b.totalSales - a.totalSales);
        } catch (error) {
            console.error('Get waiter performance error:', error);
            return [];
        }
    },

    // Get best-selling item
    getBestSellingItem: function(startDate, endDate) {
        try {
            const productSales = this.getProductSales(startDate, endDate);
            return productSales.length > 0 ? productSales[0] : null;
        } catch (error) {
            console.error('Get best-selling item error:', error);
            return null;
        }
    },

    // Get average preparation time
    getAvgPrepTime: function(startDate, endDate) {
        try {
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate >= startDate && orderDate <= endDate && order.readyAt && order.createdAt;
            });

            const prepTimes = filteredOrders.map(order => {
                const created = new Date(order.createdAt);
                const ready = new Date(order.readyAt);
                return (ready - created) / 60000; // minutes
            });

            if (prepTimes.length === 0) return 0;
            return prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length;
        } catch (error) {
            console.error('Get avg prep time error:', error);
            return 0;
        }
    },

    // Export report to CSV
    exportToCSV: function(data, filename) {
        try {
            if (!data || data.length === 0) {
                return { success: false, error: 'No data to export' };
            }

            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value || '');
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Export to CSV error:', error);
            return { success: false, error: 'Failed to export CSV' };
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReportService };
}
