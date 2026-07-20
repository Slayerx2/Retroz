// UI Utilities - Custom Modals, Toasts, and Dialogs
// Replaces browser alert(), confirm(), and prompt() with custom UI

const UIUtils = {
    // Toast notifications
    toast: {
        show(message, type = 'info', duration = 3000) {
            // Remove existing toast
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) {
                existingToast.remove();
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            
            const icon = this.getIcon(type);
            toast.innerHTML = `
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close notification">×</button>
            `;

            // Add to DOM
            document.body.appendChild(toast);

            // Close button handler
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.remove();
            });

            // Auto-dismiss
            if (duration > 0) {
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, duration);
            }

            return toast;
        },

        getIcon(type) {
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ',
                loading: '⟳'
            };
            return icons[type] || icons.info;
        },

        success(message, duration) {
            return this.show(message, 'success', duration);
        },

        error(message, duration) {
            return this.show(message, 'error', duration);
        },

        warning(message, duration) {
            return this.show(message, 'warning', duration);
        },

        info(message, duration) {
            return this.show(message, 'info', duration);
        },

        loading(message = 'Loading...', duration = 0) {
            return this.show(message, 'loading', duration);
        }
    },

    // Custom modals
    modal: {
        create(options = {}) {
            const {
                title = '',
                content = '',
                showClose = true,
                size = 'medium', // small, medium, large
                onClose = null
            } = options;

            // Remove existing modal
            const existingModal = document.querySelector('.custom-modal-overlay');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'modal-title');

            const modal = document.createElement('div');
            modal.className = `custom-modal modal-${size}`;

            modal.innerHTML = `
                <div class="modal-header">
                    <h2 id="modal-title">${title}</h2>
                    ${showClose ? '<button class="modal-close-btn" aria-label="Close modal">×</button>' : ''}
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer"></div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Close button handler
            if (showClose) {
                modal.querySelector('.modal-close-btn').addEventListener('click', () => {
                    this.close(overlay);
                    if (onClose) onClose();
                });
            }

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay);
                    if (onClose) onClose();
                }
            });

            // Close on Escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.close(overlay);
                    if (onClose) onClose();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            // Focus trap
            const focusableElements = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                setTimeout(() => focusableElements[0].focus(), 100);
            }

            return {
                overlay,
                modal,
                close: () => {
                    this.close(overlay);
                    document.removeEventListener('keydown', escapeHandler);
                    if (onClose) onClose();
                },
                addFooterButton: (text, onClick, primary = false) => {
                    const footer = modal.querySelector('.modal-footer');
                    const button = document.createElement('button');
                    button.className = primary ? 'btn-primary' : 'btn-secondary';
                    button.textContent = text;
                    button.addEventListener('click', () => {
                        onClick();
                    });
                    footer.appendChild(button);
                    return button;
                },
                setContent: (newContent) => {
                    modal.querySelector('.modal-body').innerHTML = newContent;
                }
            };
        },

        close(overlay) {
            overlay.classList.add('modal-closing');
            setTimeout(() => {
                if (overlay.parentElement) {
                    overlay.remove();
                }
            }, 200);
        },

        confirm(options = {}) {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                onConfirm = null,
                onCancel = null
            } = options;

            const modalInstance = this.create({
                title,
                content: `<p>${message}</p>`,
                showClose: true
            });

            modalInstance.addFooterButton(cancelText, () => {
                modalInstance.close();
                if (onCancel) onCancel();
            }, false);

            modalInstance.addFooterButton(confirmText, () => {
                modalInstance.close();
                if (onConfirm) onConfirm();
            }, true);

            return modalInstance;
        },

        alert(options = {}) {
            const {
                title = 'Alert',
                message = '',
                buttonText = 'OK',
                onButton = null
            } = options;

            const modalInstance = this.create({
                title,
                content: `<p>${message}</p>`,
                showClose: true
            });

            modalInstance.addFooterButton(buttonText, () => {
                modalInstance.close();
                if (onButton) onButton();
            }, true);

            return modalInstance;
        },

        prompt(options = {}) {
            const {
                title = 'Input',
                message = '',
                placeholder = '',
                defaultValue = '',
                confirmText = 'OK',
                cancelText = 'Cancel',
                onConfirm = null,
                onCancel = null
            } = options;

            const inputId = 'prompt-input-' + Date.now();
            const modalInstance = this.create({
                title,
                content: `
                    <p>${message}</p>
                    <input type="text" id="${inputId}" class="modal-input" placeholder="${placeholder}" value="${defaultValue}" />
                `,
                showClose: true
            });

            const input = modalInstance.modal.querySelector(`#${inputId}`);
            setTimeout(() => input.focus(), 100);

            modalInstance.addFooterButton(cancelText, () => {
                modalInstance.close();
                if (onCancel) onCancel();
            }, false);

            modalInstance.addFooterButton(confirmText, () => {
                modalInstance.close();
                if (onConfirm) onConfirm(input.value);
            }, true);

            // Allow Enter to submit
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    modalInstance.close();
                    if (onConfirm) onConfirm(input.value);
                }
            });

            return modalInstance;
        }
    },

    // Loading states
    loading: {
        show(message = 'Loading...') {
            const existingLoader = document.querySelector('.loading-overlay');
            if (existingLoader) {
                existingLoader.remove();
            }

            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.setAttribute('role', 'status');
            overlay.setAttribute('aria-live', 'polite');
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            `;

            document.body.appendChild(overlay);
            return overlay;
        },

        hide() {
            const loader = document.querySelector('.loading-overlay');
            if (loader) {
                loader.remove();
            }
        },

        withPromise(promise, message = 'Loading...') {
            this.show(message);
            return promise.finally(() => {
                this.hide();
            });
        }
    },

    // Button state management
    button: {
        disable(button, originalText = null) {
            if (!button) return;
            button.dataset.originalText = originalText || button.textContent;
            button.disabled = true;
            button.classList.add('btn-disabled');
            button.textContent = 'Processing...';
        },

        enable(button) {
            if (!button) return;
            button.disabled = false;
            button.classList.remove('btn-disabled');
            button.textContent = button.dataset.originalText || 'Submit';
            delete button.dataset.originalText;
        },

        setLoading(button, loading = true) {
            if (loading) {
                this.disable(button);
            } else {
                this.enable(button);
            }
        }
    },

    // Form validation
    validation: {
        validate(form) {
            const errors = [];
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    errors.push(`${input.previousElementSibling?.textContent || input.name} is required`);
                    input.classList.add('input-error');
                } else {
                    input.classList.remove('input-error');
                }
            });

            return {
                valid: errors.length === 0,
                errors
            };
        },

        clearErrors(form) {
            const inputs = form.querySelectorAll('.input-error');
            inputs.forEach(input => input.classList.remove('input-error'));
        }
    },

    // Empty state helpers
    emptyState: {
        show(container, message = 'No data available', icon = '📭') {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${icon}</div>
                    <div class="empty-state-message">${message}</div>
                </div>
            `;
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
}
