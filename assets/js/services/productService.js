// Product Service - Abstracts product/menu operations from localStorage
// This service will be replaced with Supabase operations in the future

const ProductService = {
    // Get all products
    getAllProducts: function() {
        try {
            if (typeof StorageService !== 'undefined' && StorageService.getProducts) {
                return StorageService.getProducts();
            }
            return JSON.parse(localStorage.getItem('cafe_menu') || '[]');
        } catch (error) {
            console.error('Get products error:', error);
            return [];
        }
    },

    // Get available products (not archived and available)
    getAvailableProducts: function() {
        try {
            const products = this.getAllProducts();
            return products.filter(p => p.available && !p.archived);
        } catch (error) {
            console.error('Get available products error:', error);
            return [];
        }
    },

    // Get product by ID
    getProductById: function(productId) {
        try {
            const products = this.getAllProducts();
            return products.find(p => p.id == productId);
        } catch (error) {
            console.error('Get product by ID error:', error);
            return null;
        }
    },

    // Create new product
    createProduct: function(productData, userId) {
        try {
            const products = this.getAllProducts();
            const newId = Math.max(...products.map(p => p.id), 0) + 1;

            const newProduct = {
                id: newId,
                name: productData.name,
                category: productData.category || 'other',
                price: productData.price,
                description: productData.description || '',
                imageUrl: productData.imageUrl || '',
                vegetarian: productData.vegetarian || false,
                preparationTime: productData.preparationTime || 0,
                available: productData.available !== false,
                archived: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            products.push(newProduct);

            if (typeof StorageService !== 'undefined' && StorageService.setProducts) {
                StorageService.setProducts(products);
            } else {
                localStorage.setItem('cafe_menu', JSON.stringify(products));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'menu_item_created',
                    entityType: 'product',
                    entityId: newId.toString(),
                    description: `Menu item "${productData.name}" created`
                });
            }

            return { success: true, product: newProduct };
        } catch (error) {
            console.error('Create product error:', error);
            return { success: false, error: 'Failed to create product' };
        }
    },

    // Update product
    updateProduct: function(productId, productData, userId) {
        try {
            const products = this.getAllProducts();
            const index = products.findIndex(p => p.id == productId);

            if (index === -1) {
                return { success: false, error: 'Product not found' };
            }

            products[index] = {
                ...products[index],
                ...productData,
                id: productId, // Preserve ID
                updatedAt: new Date().toISOString()
            };

            if (typeof StorageService !== 'undefined' && StorageService.setProducts) {
                StorageService.setProducts(products);
            } else {
                localStorage.setItem('cafe_menu', JSON.stringify(products));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'menu_item_edited',
                    entityType: 'product',
                    entityId: productId.toString(),
                    description: `Menu item "${productData.name}" edited`
                });
            }

            return { success: true, product: products[index] };
        } catch (error) {
            console.error('Update product error:', error);
            return { success: false, error: 'Failed to update product' };
        }
    },

    // Toggle product availability
    toggleAvailability: function(productId, userId) {
        try {
            const products = this.getAllProducts();
            const index = products.findIndex(p => p.id == productId);

            if (index === -1) {
                return { success: false, error: 'Product not found' };
            }

            const newAvailability = !products[index].available;
            products[index].available = newAvailability;
            products[index].updatedAt = new Date().toISOString();

            if (typeof StorageService !== 'undefined' && StorageService.setProducts) {
                StorageService.setProducts(products);
            } else {
                localStorage.setItem('cafe_menu', JSON.stringify(products));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'availability_changed',
                    entityType: 'product',
                    entityId: productId.toString(),
                    description: `Menu item "${products[index].name}" ${newAvailability ? 'enabled' : 'disabled'}`
                });
            }

            return { success: true, product: products[index] };
        } catch (error) {
            console.error('Toggle availability error:', error);
            return { success: false, error: 'Failed to toggle availability' };
        }
    },

    // Archive product
    archiveProduct: function(productId, userId) {
        try {
            const products = this.getAllProducts();
            const index = products.findIndex(p => p.id == productId);

            if (index === -1) {
                return { success: false, error: 'Product not found' };
            }

            const newArchivedState = !products[index].archived;
            products[index].archived = newArchivedState;
            products[index].available = !newArchivedState; // Archive also disables
            products[index].updatedAt = new Date().toISOString();

            if (typeof StorageService !== 'undefined' && StorageService.setProducts) {
                StorageService.setProducts(products);
            } else {
                localStorage.setItem('cafe_menu', JSON.stringify(products));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: newArchivedState ? 'product_archived' : 'product_unarchived',
                    entityType: 'product',
                    entityId: productId.toString(),
                    description: `Menu item "${products[index].name}" ${newArchivedState ? 'archived' : 'unarchived'}`
                });
            }

            return { success: true, product: products[index] };
        } catch (error) {
            console.error('Archive product error:', error);
            return { success: false, error: 'Failed to archive product' };
        }
    },

    // Get products by category
    getProductsByCategory: function(category) {
        try {
            const products = this.getAllProducts();
            return products.filter(p => p.category === category);
        } catch (error) {
            console.error('Get products by category error:', error);
            return [];
        }
    },

    // Search products
    searchProducts: function(searchTerm) {
        try {
            const products = this.getAllProducts();
            const term = searchTerm.toLowerCase();
            return products.filter(p => 
                p.name.toLowerCase().includes(term) ||
                p.description.toLowerCase().includes(term) ||
                p.category.toLowerCase().includes(term)
            );
        } catch (error) {
            console.error('Search products error:', error);
            return [];
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductService };
}
