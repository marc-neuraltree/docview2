class PDFService {
    constructor() {
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.canvas = null;
        this.context = null;
        this.resizeTimeout = null;
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Add resize handler for responsive scaling
        this.setupResizeHandler();
    }

    async loadPDF(documentId) {
        try {
            showLoading(true);
            
            const pdfUrl = `/api/documents/doc/${documentId}/content`;
            console.log('Loading PDF from URL:', pdfUrl);
            
            this.currentPDF = await pdfjsLib.getDocument(pdfUrl).promise;
            console.log('PDF loaded successfully, pages:', this.currentPDF.numPages);
            
            this.totalPages = this.currentPDF.numPages;
            this.currentPage = 1;
            
            this.setupCanvas();
            
            // Automatically fit to width on load
            await this.fitToWidth();
            
            // Test scrolling after rendering
            const container = document.querySelector('.pdf-canvas-container');
            if (container) {
                console.log('Container dimensions:', {
                    scrollHeight: container.scrollHeight,
                    clientHeight: container.clientHeight,
                    offsetHeight: container.offsetHeight,
                    isScrollable: container.scrollHeight > container.clientHeight
                });
            }
            
            this.updatePageInfo();
            this.updateNavigationButtons();
            
            showLoading(false);
            return true;
        } catch (error) {
            console.error('Error loading PDF:', error);
            console.error('Error details:', error.message);
            this.showError(`Failed to load PDF document: ${error.message}`);
            showLoading(false);
            return false;
        }
    }

    setupCanvas() {
        const viewer = document.getElementById('pdf-viewer');
        viewer.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'pdf-canvas-container';
        
        // Force scrollable container with fixed height
        container.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: 32px !important;
            background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scroll-behavior: smooth !important;
            height: 100% !important;
            max-height: 100% !important;
            position: relative !important;
        `;
        
        this.pageCanvases = [];
        this.pageContainers = [];
        
        viewer.appendChild(container);
        
        console.log('PDF container setup complete, scrollable:', container.scrollHeight > container.clientHeight);
        
        // Debug parent containers
        const viewerElement = document.getElementById('pdf-viewer');
        const viewerContent = viewerElement.parentElement;
        const rightPanel = viewerContent.parentElement;
        
        console.log('Parent container dimensions:', {
            viewer: {
                scrollHeight: viewerElement.scrollHeight,
                clientHeight: viewerElement.clientHeight,
                offsetHeight: viewerElement.offsetHeight
            },
            viewerContent: {
                scrollHeight: viewerContent.scrollHeight,
                clientHeight: viewerContent.clientHeight,
                offsetHeight: viewerContent.offsetHeight
            },
            rightPanel: {
                scrollHeight: rightPanel.scrollHeight,
                clientHeight: rightPanel.clientHeight,
                offsetHeight: rightPanel.offsetHeight
            }
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            // Debounce resize events to avoid excessive re-rendering
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            this.resizeTimeout = setTimeout(async () => {
                if (this.currentPDF) {
                    await this.fitToWidth();
                }
            }, 250); // Wait 250ms after resize stops
        });
    }

    async renderAllPages() {
        if (!this.currentPDF) return;
        
        try {
            const container = document.querySelector('.pdf-canvas-container');
            container.innerHTML = '';
            
            this.pageCanvases = [];
            this.pageContainers = [];
            
            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                const page = await this.currentPDF.getPage(pageNum);
                const viewport = page.getViewport({ scale: this.scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.cssText = `
                    display: block;
                    margin: 0 auto 20px auto;
                    max-width: 100%;
                    height: auto;
                `;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                container.appendChild(canvas);
                this.pageCanvases.push(canvas);
                this.pageContainers.push(canvas);
            }
            
        } catch (error) {
            console.error('Error rendering all pages:', error);
            this.showError('Failed to render PDF pages');
        }
    }

    async renderPage(pageNum) {
        // This method is now deprecated since we render all pages at once
        // Keeping it for compatibility with existing code
        console.log('renderPage called - now using renderAllPages');
    }

    async nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.scrollToPage(this.currentPage);
            this.updatePageInfo();
            this.updateNavigationButtons();
        }
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.scrollToPage(this.currentPage);
            this.updatePageInfo();
            this.updateNavigationButtons();
        }
    }

    async goToPage(pageNum) {
        const page = parseInt(pageNum);
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.scrollToPage(this.currentPage);
            this.updatePageInfo();
            this.updateNavigationButtons();
        }
    }

    scrollToPage(pageNum) {
        if (this.pageContainers && this.pageContainers[pageNum - 1]) {
            const pageContainer = this.pageContainers[pageNum - 1];
            pageContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    async zoomIn() {
        this.scale = Math.min(this.scale * 1.2, 3.0);
        await this.renderAllPages();
        this.updateZoomLevel();
    }

    async zoomOut() {
        this.scale = Math.max(this.scale / 1.2, 0.3);
        await this.renderAllPages();
        this.updateZoomLevel();
    }

    async fitToWidth() {
        if (!this.currentPDF) return;
        
        const viewerElement = document.getElementById('pdf-viewer');
        const container = viewerElement.querySelector('.pdf-canvas-container');
        
        if (container) {
            // Get the available width, accounting for padding and margins
            const containerWidth = container.clientWidth - 80; // 40px padding on each side
            const page = await this.currentPDF.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Calculate scale to fit width, with a small margin
            this.scale = Math.min(containerWidth / viewport.width, 2.0); // Cap at 200% zoom
            
            await this.renderAllPages();
            this.updateZoomLevel();
        }
    }

    updatePageInfo() {
        document.getElementById('current-page').value = this.currentPage;
        document.getElementById('total-pages').textContent = this.totalPages;
        
        // Update the page display to show "All Pages" since we're showing everything
        const pageDisplay = document.getElementById('page-number-display');
        if (pageDisplay) {
            pageDisplay.textContent = `All Pages (${this.totalPages} total)`;
        }
    }

    updateNavigationButtons() {
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= this.totalPages;
    }

    updateZoomLevel() {
        document.getElementById('zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
    }

    showError(message) {
        const viewerElement = document.getElementById('pdf-viewer');
        viewerElement.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Error Loading Document</h3>
                <p>${message}</p>
                <button class="action-btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    showWelcomeMessage() {
        const viewerElement = document.getElementById('pdf-viewer');
        viewerElement.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">📄</div>
                <h2>Military Document Viewer</h2>
                <p>Select a document from the left panel to begin viewing</p>
                <div class="quick-actions">
                    <p>Documents are loaded from the backend directories</p>
                </div>
            </div>
        `;
        
        document.getElementById('current-document').textContent = 'No document selected';
        document.getElementById('document-meta').innerHTML = '';
        document.getElementById('current-page').value = 1;
        document.getElementById('total-pages').textContent = '0';
        document.getElementById('prev-page').disabled = true;
        document.getElementById('next-page').disabled = true;
    }

    async toggleFullscreen() {
        const viewerElement = document.getElementById('pdf-viewer');
        
        if (!document.fullscreenElement) {
            try {
                await viewerElement.requestFullscreen();
                viewerElement.classList.add('fullscreen-viewer');
            } catch (error) {
                console.error('Error entering fullscreen:', error);
            }
        } else {
            try {
                await document.exitFullscreen();
                viewer.classList.remove('fullscreen-viewer');
            } catch (error) {
                console.error('Error exiting fullscreen:', error);
            }
        }
    }
}

const pdfService = new PDFService();