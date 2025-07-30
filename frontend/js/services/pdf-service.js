class PDFService {
    constructor() {
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.canvas = null;
        this.context = null;
        this.resizeTimeout = null;
        this.textContent = [];
        this.pageTexts = new Map();
        
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
        
        // Force scrollable container with GitHub styling
        container.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: var(--space-5) var(--space-3) !important;
            background: var(--color-canvas-subtle) !important;
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
            this.textContent = [];
            this.pageTexts.clear();
            
            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                const page = await this.currentPDF.getPage(pageNum);
                const viewport = page.getViewport({ scale: this.scale });
                
                // Create page container
                const pageContainer = document.createElement('div');
                pageContainer.className = 'pdf-page-container';
                pageContainer.style.cssText = `
                    position: relative;
                    margin: 0 auto 24px auto;
                    box-shadow: var(--shadow-medium);
                    border: 1px solid var(--color-border-default);
                    background: var(--color-canvas-default);
                    border-radius: 8px;
                    overflow: hidden;
                    width: ${viewport.width}px;
                    height: ${viewport.height}px;
                `;
                
                // Create canvas for visual rendering
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                `;
                
                // Create text layer div
                const textLayerDiv = document.createElement('div');
                textLayerDiv.className = 'textLayer';
                textLayerDiv.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: ${viewport.width}px;
                    height: ${viewport.height}px;
                    color: rgba(0,0,0,0.2);
                    font-family: sans-serif;
                    overflow: hidden;
                `;
                
                // Render the canvas
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // Get text content and render text layer
                const textContent = await page.getTextContent();
                this.pageTexts.set(pageNum, textContent);
                
                // Render text layer for selection and search
                pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                    textDivs: []
                });
                
                // Add page number label
                const pageLabel = document.createElement('div');
                pageLabel.className = 'page-number';
                pageLabel.textContent = `Page ${pageNum}`;
                
                // Assemble the page
                pageContainer.appendChild(canvas);
                pageContainer.appendChild(textLayerDiv);
                pageContainer.appendChild(pageLabel);
                container.appendChild(pageContainer);
                
                this.pageCanvases.push(canvas);
                this.pageContainers.push(pageContainer);
                
                // Store text content for searching
                const pageText = textContent.items.map(item => item.str).join(' ');
                this.textContent.push({
                    pageNum: pageNum,
                    text: pageText
                });
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
                viewerElement.classList.remove('fullscreen-viewer');
            } catch (error) {
                console.error('Error exiting fullscreen:', error);
            }
        }
    }

    // Search functionality for PDF content
    searchInPDF(query) {
        if (!query.trim() || !this.textContent.length) {
            return [];
        }

        const results = [];
        const searchTerm = query.toLowerCase();

        this.textContent.forEach((pageData) => {
            const text = pageData.text.toLowerCase();
            const index = text.indexOf(searchTerm);
            
            if (index !== -1) {
                // Get context around the match
                const contextStart = Math.max(0, index - 50);
                const contextEnd = Math.min(text.length, index + searchTerm.length + 50);
                const context = text.substring(contextStart, contextEnd);
                
                results.push({
                    pageNum: pageData.pageNum,
                    context: context,
                    position: index
                });
            }
        });

        return results;
    }

    // Highlight search results
    highlightSearchResults(query) {
        if (!query.trim()) {
            this.clearHighlights();
            return;
        }

        const searchTerm = query.toLowerCase();
        
        // Clear previous highlights
        this.clearHighlights();

        // Add highlights to text layers
        document.querySelectorAll('.textLayer').forEach((textLayer, pageIndex) => {
            const textDivs = textLayer.querySelectorAll('span, div');
            
            textDivs.forEach(textDiv => {
                const text = textDiv.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    textDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                    textDiv.classList.add('search-highlight');
                }
            });
        });
    }

    clearHighlights() {
        document.querySelectorAll('.search-highlight').forEach(element => {
            element.style.backgroundColor = '';
            element.classList.remove('search-highlight');
        });
    }

    // Get all text content for external search
    getAllTextContent() {
        return this.textContent.map(page => ({
            pageNum: page.pageNum,
            text: page.text
        }));
    }
}

// Make the search functionality available globally
window.searchCurrentPDF = function(query) {
    if (pdfService && pdfService.currentPDF) {
        const results = pdfService.searchInPDF(query);
        pdfService.highlightSearchResults(query);
        return results;
    }
    return [];
};

window.clearPDFHighlights = function() {
    if (pdfService) {
        pdfService.clearHighlights();
    }
};

const pdfService = new PDFService();