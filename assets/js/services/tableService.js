// Table Service - Abstracts table operations from localStorage
// This service will be replaced with Supabase operations in the future

const TableService = {
    // Get all tables
    getAllTables: function() {
        try {
            if (typeof StorageService !== 'undefined' && StorageService.getTables) {
                return StorageService.getTables();
            }
            return JSON.parse(localStorage.getItem('cafe_tables') || '[]');
        } catch (error) {
            console.error('Get tables error:', error);
            return [];
        }
    },

    // Get table by ID
    getTableById: function(tableId) {
        try {
            const tables = this.getAllTables();
            return tables.find(t => t.id == tableId);
        } catch (error) {
            console.error('Get table by ID error:', error);
            return null;
        }
    },

    // Create new table
    createTable: function(tableData, userId) {
        try {
            const tables = this.getAllTables();
            const newId = Math.max(...tables.map(t => t.id), 0) + 1;

            const newTable = {
                id: newId,
                name: tableData.name,
                enabled: tableData.enabled !== false,
                capacity: tableData.capacity || 4
            };

            tables.push(newTable);

            if (typeof StorageService !== 'undefined' && StorageService.setTables) {
                StorageService.setTables(tables);
            } else {
                localStorage.setItem('cafe_tables', JSON.stringify(tables));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'table_created',
                    entityType: 'table',
                    entityId: newId.toString(),
                    description: `Table "${tableData.name}" created`
                });
            }

            return { success: true, table: newTable };
        } catch (error) {
            console.error('Create table error:', error);
            return { success: false, error: 'Failed to create table' };
        }
    },

    // Update table
    updateTable: function(tableId, tableData, userId) {
        try {
            const tables = this.getAllTables();
            const index = tables.findIndex(t => t.id == tableId);

            if (index === -1) {
                return { success: false, error: 'Table not found' };
            }

            tables[index] = {
                ...tables[index],
                ...tableData,
                id: tableId, // Preserve ID
            };

            if (typeof StorageService !== 'undefined' && StorageService.setTables) {
                StorageService.setTables(tables);
            } else {
                localStorage.setItem('cafe_tables', JSON.stringify(tables));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'table_edited',
                    entityType: 'table',
                    entityId: tableId.toString(),
                    description: `Table "${tableData.name}" edited`
                });
            }

            return { success: true, table: tables[index] };
        } catch (error) {
            console.error('Update table error:', error);
            return { success: false, error: 'Failed to update table' };
        }
    },

    // Toggle table enabled status
    toggleTableEnabled: function(tableId, userId) {
        try {
            const tables = this.getAllTables();
            const index = tables.findIndex(t => t.id == tableId);

            if (index === -1) {
                return { success: false, error: 'Table not found' };
            }

            const newEnabledState = !tables[index].enabled;
            tables[index].enabled = newEnabledState;

            if (typeof StorageService !== 'undefined' && StorageService.setTables) {
                StorageService.setTables(tables);
            } else {
                localStorage.setItem('cafe_tables', JSON.stringify(tables));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'table_toggled',
                    entityType: 'table',
                    entityId: tableId.toString(),
                    description: `Table "${tables[index].name}" ${newEnabledState ? 'enabled' : 'disabled'}`
                });
            }

            return { success: true, table: tables[index] };
        } catch (error) {
            console.error('Toggle table error:', error);
            return { success: false, error: 'Failed to toggle table' };
        }
    },

    // Delete table
    deleteTable: function(tableId, userId) {
        try {
            const tables = this.getAllTables();
            const index = tables.findIndex(t => t.id == tableId);

            if (index === -1) {
                return { success: false, error: 'Table not found' };
            }

            // Check if table has active orders
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            const hasActiveOrders = orders.some(o => 
                o.tableId == tableId && 
                o.status !== 'paid' && 
                o.status !== 'cancelled'
            );

            if (hasActiveOrders) {
                return { success: false, error: 'Cannot delete table with active orders' };
            }

            const tableName = tables[index].name;
            tables.splice(index, 1);

            if (typeof StorageService !== 'undefined' && StorageService.setTables) {
                StorageService.setTables(tables);
            } else {
                localStorage.setItem('cafe_tables', JSON.stringify(tables));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'table_deleted',
                    entityType: 'table',
                    entityId: tableId.toString(),
                    description: `Table "${tableName}" deleted`
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Delete table error:', error);
            return { success: false, error: 'Failed to delete table' };
        }
    },

    // Get enabled tables
    getEnabledTables: function() {
        try {
            const tables = this.getAllTables();
            return tables.filter(t => t.enabled);
        } catch (error) {
            console.error('Get enabled tables error:', error);
            return [];
        }
    },

    // Get table status (occupied/free)
    getTableStatus: function(tableId) {
        try {
            const orders = typeof OrderService !== 'undefined' ? OrderService.getAllOrders() : [];
            const activeOrders = orders.filter(o => 
                o.tableId == tableId && 
                o.status !== 'paid' && 
                o.status !== 'cancelled'
            );
            
            return {
                occupied: activeOrders.length > 0,
                activeOrders: activeOrders.length
            };
        } catch (error) {
            console.error('Get table status error:', error);
            return { occupied: false, activeOrders: 0 };
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TableService };
}
