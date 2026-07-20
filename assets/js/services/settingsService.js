// Settings Service - Abstracts settings operations from localStorage
// This service will be replaced with Supabase operations in the future

const SettingsService = {
    // Get all settings
    getAllSettings: function() {
        try {
            if (typeof StorageService !== 'undefined' && StorageService.getSettings) {
                return StorageService.getSettings();
            }
            return JSON.parse(localStorage.getItem('cafe_settings') || '{}');
        } catch (error) {
            console.error('Get settings error:', error);
            return this.getDefaultSettings();
        }
    },

    // Get default settings
    getDefaultSettings: function() {
        return {
            cafeName: 'CaféPOS',
            address: '',
            phone: '',
            currency: 'NPR',
            vatRate: 13,
            serviceChargeRate: 10,
            receiptFooter: 'Thank you for dining with us!',
            kitchenWarningTime: 10,
            kitchenDelayTime: 20,
            theme: 'light'
        };
    },

    // Get specific setting
    getSetting: function(key) {
        try {
            const settings = this.getAllSettings();
            return settings[key];
        } catch (error) {
            console.error('Get setting error:', error);
            return null;
        }
    },

    // Update settings
    updateSettings: function(settingsData, userId) {
        try {
            const currentSettings = this.getAllSettings();
            const newSettings = {
                ...currentSettings,
                ...settingsData
            };

            if (typeof StorageService !== 'undefined' && StorageService.setSettings) {
                StorageService.setSettings(newSettings);
            } else {
                localStorage.setItem('cafe_settings', JSON.stringify(newSettings));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'settings_changed',
                    entityType: 'settings',
                    entityId: 'global',
                    description: 'System settings updated'
                });
            }

            return { success: true, settings: newSettings };
        } catch (error) {
            console.error('Update settings error:', error);
            return { success: false, error: 'Failed to update settings' };
        }
    },

    // Reset settings to defaults
    resetSettings: function(userId) {
        try {
            const defaultSettings = this.getDefaultSettings();
            
            if (typeof StorageService !== 'undefined' && StorageService.setSettings) {
                StorageService.setSettings(defaultSettings);
            } else {
                localStorage.setItem('cafe_settings', JSON.stringify(defaultSettings));
            }

            // Add audit log
            if (typeof StorageService !== 'undefined' && StorageService.addAuditLog) {
                StorageService.addAuditLog({
                    userId: userId || 'system',
                    action: 'settings_reset',
                    entityType: 'settings',
                    entityId: 'global',
                    description: 'System settings reset to defaults'
                });
            }

            return { success: true, settings: defaultSettings };
        } catch (error) {
            console.error('Reset settings error:', error);
            return { success: false, error: 'Failed to reset settings' };
        }
    },

    // Get cafe name
    getCafeName: function() {
        return this.getSetting('cafeName') || 'CaféPOS';
    },

    // Get currency
    getCurrency: function() {
        return this.getSetting('currency') || 'NPR';
    },

    // Get VAT rate
    getVATRate: function() {
        return this.getSetting('vatRate') || 13;
    },

    // Get service charge rate
    getServiceChargeRate: function() {
        return this.getSetting('serviceChargeRate') || 10;
    },

    // Get kitchen warning time
    getKitchenWarningTime: function() {
        return this.getSetting('kitchenWarningTime') || 10;
    },

    // Get kitchen delay time
    getKitchenDelayTime: function() {
        return this.getSetting('kitchenDelayTime') || 20;
    },

    // Get receipt footer
    getReceiptFooter: function() {
        return this.getSetting('receiptFooter') || 'Thank you for dining with us!';
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsService };
}
