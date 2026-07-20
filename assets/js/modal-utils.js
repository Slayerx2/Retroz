// Custom Modal Utilities - Reusable modal system to replace browser alert/confirm/prompt

const ModalUtils = {
    // Show a confirmation dialog
    confirm: function(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning', // warning, danger, info
                onConfirm = null,
                onCancel = null
            } = options;

            // Remove existing modal if any
            const existingModal = document.getElementById('customConfirmModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'customConfirmModal';
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'confirmModalTitle');

            const typeColors = {
                warning: '#ff9800',
                danger: '#f44336',
                info: '#2196f3'
            };

            modal.innerHTML = `
                <div class="modal-content confirm-modal">
                    <div class="modal-header">
                        <h3 id="confirmModalTitle">${title}</h3>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary cancel-btn">${cancelText}</button>
                        <button class="btn-primary confirm-btn" style="background: ${typeColors[type]}">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            const closeBtn = modal.querySelector('.modal-close');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const confirmBtn = modal.querySelector('.confirm-btn');

            const closeModal = () => {
                modal.remove();
                if (onCancel) onCancel();
                resolve(false);
            };

            const confirmAction = () => {
                modal.remove();
                if (onConfirm) onConfirm();
                resolve(true);
            };

            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            confirmBtn.addEventListener('click', confirmAction);

            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Focus management
            setTimeout(() => {
                cancelBtn.focus();
            }, 100);
        });
    },

    // Show an alert dialog
    alert: function(options) {
        return new Promise((resolve) => {
            const {
                title = 'Alert',
                message = '',
                type = 'info', // success, error, warning, info
                buttonText = 'OK',
                onOk = null
            } = options;

            // Remove existing modal if any
            const existingModal = document.getElementById('customAlertModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'customAlertModal';
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.setAttribute('role', 'alertdialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'alertModalTitle');

            const typeColors = {
                success: '#4caf50',
                error: '#f44336',
                warning: '#ff9800',
                info: '#2196f3'
            };

            const typeIcons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };

            modal.innerHTML = `
                <div class="modal-content alert-modal">
                    <div class="modal-header">
                        <h3 id="alertModalTitle">
                            <span class="alert-icon">${typeIcons[type]}</span>
                            ${title}
                        </h3>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-primary ok-btn" style="background: ${typeColors[type]}">${buttonText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            const closeBtn = modal.querySelector('.modal-close');
            const okBtn = modal.querySelector('.ok-btn');

            const closeModal = () => {
                modal.remove();
                if (onOk) onOk();
                resolve();
            };

            closeBtn.addEventListener('click', closeModal);
            okBtn.addEventListener('click', closeModal);

            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Focus management
            setTimeout(() => {
                okBtn.focus();
            }, 100);
        });
    },

    // Show a prompt dialog
    prompt: function(options) {
        return new Promise((resolve) => {
            const {
                title = 'Input Required',
                message = '',
                placeholder = '',
                defaultValue = '',
                type = 'text', // text, number, password
                required = false,
                onConfirm = null,
                onCancel = null
            } = options;

            // Remove existing modal if any
            const existingModal = document.getElementById('customPromptModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal
            const modal = document.createElement('div');
            modal.id = 'customPromptModal';
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'promptModalTitle');

            modal.innerHTML = `
                <div class="modal-content prompt-modal">
                    <div class="modal-header">
                        <h3 id="promptModalTitle">${title}</h3>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <input type="${type}" 
                               class="prompt-input" 
                               placeholder="${placeholder}" 
                               value="${defaultValue}"
                               ${required ? 'required' : ''}
                               aria-label="${message}">
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary cancel-btn">Cancel</button>
                        <button class="btn-primary confirm-btn">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            const closeBtn = modal.querySelector('.modal-close');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const confirmBtn = modal.querySelector('.confirm-btn');
            const input = modal.querySelector('.prompt-input');

            const closeModal = () => {
                modal.remove();
                if (onCancel) onCancel();
                resolve(null);
            };

            const confirmAction = () => {
                if (required && !input.value.trim()) {
                    input.classList.add('error');
                    input.focus();
                    return;
                }
                modal.remove();
                if (onConfirm) onConfirm(input.value);
                resolve(input.value);
            };

            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            confirmBtn.addEventListener('click', confirmAction);

            // Submit on Enter key
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    confirmAction();
                }
            });

            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });

            // Focus management
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        });
    },

    // Show a loading modal
    showLoading: function(message = 'Loading...') {
        // Remove existing loading modal if any
        const existingModal = document.getElementById('customLoadingModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'customLoadingModal';
        modal.className = 'modal loading-modal';
        modal.style.display = 'flex';
        modal.setAttribute('role', 'progressbar');
        modal.setAttribute('aria-label', message);
        modal.setAttribute('aria-busy', 'true');

        modal.innerHTML = `
            <div class="modal-content loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    },

    // Hide loading modal
    hideLoading: function() {
        const modal = document.getElementById('customLoadingModal');
        if (modal) {
            modal.remove();
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalUtils };
}
