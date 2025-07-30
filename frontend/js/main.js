class App {
    constructor() {
        this.initialized = false;
        this.healthCheckInterval = null;
        this.init();
    }

    async init() {
        try {
            await this.checkSystemHealth();
            this.setupGlobalEventListeners();
            this.startHealthMonitoring();
            this.initialized = true;
            
            console.log('Military PDF Viewer initialized successfully');
            Utils.showNotification('System ready', 'success', 2000);
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Utils.showNotification('System initialization failed', 'error', 5000);
        }
    }

    async checkSystemHealth() {
        const isHealthy = await Utils.checkSystemHealth();
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (isHealthy) {
            statusIndicator.style.backgroundColor = '#27ae60';
            statusText.textContent = 'System Ready';
        } else {
            statusIndicator.style.backgroundColor = '#e74c3c';
            statusText.textContent = 'System Error';
        }
        
        return isHealthy;
    }

    setupGlobalEventListeners() {
        window.addEventListener('beforeunload', (event) => {
            if (pdfService.currentPDF) {
                event.preventDefault();
                event.returnValue = '';
            }
        });

        window.addEventListener('resize', Utils.debounce(() => {
            if (pdfService.currentPDF && pdfService.canvas) {
                pdfService.fitToWidth();
            }
        }, 250));

        window.addEventListener('online', () => {
            Utils.showNotification('Connection restored', 'success');
            this.checkSystemHealth();
        });

        window.addEventListener('offline', () => {
            Utils.showNotification('Connection lost', 'error');
        });

        document.addEventListener('contextmenu', (event) => {
            if (event.target.tagName === 'CANVAS') {
                event.preventDefault();
            }
        });

        document.addEventListener('selectstart', (event) => {
            if (event.target.tagName === 'CANVAS') {
                event.preventDefault();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                Utils.showNotification('Document save is not available', 'info');
            }
        });
    }

    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            await this.checkSystemHealth();
        }, 30000); // Check every 30 seconds
    }

    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
}

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});

window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// Service worker registration removed to prevent 404 errors

const emergencyReset = () => {
    if (confirm('This will reset the application and reload the page. Continue?')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }
};

window.emergencyReset = emergencyReset;

// Global function for scanning directories
async function scanDirectories() {
    try {
        const scanBtn = document.getElementById('scan-btn');
        const originalText = scanBtn.innerHTML;
        
        // Show loading state
        scanBtn.innerHTML = '⏳';
        scanBtn.disabled = true;
        
        const result = await apiService.scanDirectories();
        
        // Show success message
        Utils.showNotification(`Scan completed: ${result.summary.added} added, ${result.summary.updated} updated`, 'success', 3000);
        
        // Reload documents
        if (window.navigationManager) {
            await window.navigationManager.loadDocuments();
        }
        
    } catch (error) {
        console.error('Scan directories failed:', error);
        Utils.showNotification('Failed to scan directories', 'error', 3000);
    } finally {
        // Restore button state
        const scanBtn = document.getElementById('scan-btn');
        scanBtn.innerHTML = '📁';
        scanBtn.disabled = false;
    }
}

window.scanDirectories = scanDirectories;