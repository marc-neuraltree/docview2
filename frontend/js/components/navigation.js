class NavigationManager {
    constructor() {
        this.documents = {
            opord: [],
            warno: [],
            intel: []
        };
        this.activeDocument = null;
        this.collapsedSections = new Set();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadDocuments();
        });
    }

    async loadDocuments() {
        try {
            const categories = ['opord', 'warno', 'intel'];
            
            for (const category of categories) {
                const documents = await apiService.getDocumentsByCategory(category);
                this.documents[category] = documents;
                this.renderCategoryDocuments(category, documents);
                this.updateFileCount(category, documents.length);
            }
            
        } catch (error) {
            console.error('Error loading documents:', error);
            this.showError('Failed to load documents');
        }
    }

    renderCategoryDocuments(category, documents) {
        const fileList = document.getElementById(`${category}-files`);
        
        if (documents.length === 0) {
            const categoryInfo = {
                opord: { icon: '📋', name: 'OPORD', description: 'Operations orders and mission plans' },
                warno: { icon: '⚠️', name: 'WARNO', description: 'Warning orders and alerts' },
                intel: { icon: '🔍', name: 'INTEL', description: 'Intelligence reports and analysis' }
            };
            
            const info = categoryInfo[category] || { icon: '📄', name: 'Documents', description: 'View your documents' };
            
            fileList.innerHTML = `
                <div class="no-documents">
                    <div class="empty-state-icon">${info.icon}</div>
                    <h4>No ${info.name} Documents</h4>
                    <p>${info.description}</p>
                </div>
            `;
            return;
        }

        fileList.innerHTML = documents.map(doc => this.createDocumentItem(doc)).join('');
        
        // Generate thumbnails for documents
        setTimeout(() => {
            this.generateThumbnails(documents);
        }, 100);
    }

    async generateThumbnails(documents) {
        // Temporarily disabled thumbnail generation to focus on PDF loading
        console.log('Thumbnail generation disabled for now');
    }

    createDocumentItem(document) {
        const uploadDate = new Date(document.upload_date).toLocaleDateString();
        const fileSize = this.formatFileSize(document.file_size);
        
        return `
            <div class="file-item" data-document-id="${document.id}" onclick="selectDocument(${document.id})">
                <div class="file-thumbnail" data-document-id="${document.id}">
                    <span class="page-count">${document.page_count}</span>
                </div>
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name" title="${document.original_name}">${document.original_name}</div>
                    <div class="file-meta">${document.page_count} pages | ${fileSize} | ${uploadDate}</div>
                </div>
                <div class="file-actions">
                    <button class="file-action" onclick="event.stopPropagation(); viewDocument(${document.id})" title="View">👁️</button>
                    <button class="file-action delete" onclick="event.stopPropagation(); deleteDocument(${document.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateFileCount(category, count) {
        const countElement = document.getElementById(`${category}-count`);
        if (countElement) {
            countElement.textContent = count;
        }
    }

    toggleSection(category) {
        const content = document.getElementById(`${category}-content`);
        const toggle = document.getElementById(`${category}-toggle`);
        
        if (this.collapsedSections.has(category)) {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            toggle.textContent = '−';
            this.collapsedSections.delete(category);
        } else {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
            toggle.textContent = '+';
            this.collapsedSections.add(category);
        }
    }

    async selectDocument(documentId) {
        try {
            console.log('Selecting document ID:', documentId);
            
            if (this.activeDocument) {
                document.querySelector(`[data-document-id="${this.activeDocument}"]`)?.classList.remove('active');
            }

            const documentElement = document.querySelector(`[data-document-id="${documentId}"]`);
            if (documentElement) {
                documentElement.classList.add('active');
            }

            this.activeDocument = documentId;

            const docData = await apiService.getDocument(documentId);
            console.log('Document data:', docData);
            this.updateDocumentInfo(docData);

            console.log('Loading PDF for document ID:', documentId);
            await pdfService.loadPDF(documentId);

        } catch (error) {
            console.error('Error selecting document:', error);
            this.showError('Failed to load document');
        }
    }

    updateDocumentInfo(docData) {
        const documentName = document.getElementById('current-document');
        const documentMeta = document.getElementById('document-meta');

        documentName.textContent = docData.original_name;
        
        const uploadDate = new Date(docData.upload_date).toLocaleDateString();
        const fileSize = this.formatFileSize(docData.file_size);
        
        let metaInfo = `${docData.page_count} pages | ${fileSize} | Uploaded: ${uploadDate}`;
        
        if (docData.classification_level) {
            metaInfo += ` | Classification: ${docData.classification_level}`;
        }
        
        if (docData.description) {
            metaInfo += ` | ${docData.description}`;
        }

        documentMeta.innerHTML = metaInfo;
    }

    async deleteDocument(documentId) {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            await apiService.deleteDocument(documentId);
            
            if (this.activeDocument === documentId) {
                this.activeDocument = null;
                pdfService.showWelcomeMessage();
            }

            await this.loadDocuments();
            this.showSuccess('Document deleted successfully');

        } catch (error) {
            console.error('Error deleting document:', error);
            this.showError('Failed to delete document');
        }
    }

    async searchDocuments(query) {
        if (!query.trim()) {
            await this.loadDocuments();
            this.clearSearchResults();
            // Clear any PDF highlights
            if (window.clearPDFHighlights) {
                window.clearPDFHighlights();
            }
            return;
        }

        try {
            // Show loading state
            this.showSearchLoading(true);

            // Search both document names/metadata and PDF content in parallel
            const [nameResults, contentResults] = await Promise.all([
                apiService.searchDocuments(query),
                apiService.searchDocumentContent(query)
            ]);

            // Also search within the currently open PDF for immediate highlighting
            if (window.searchCurrentPDF) {
                const currentPdfResults = window.searchCurrentPDF(query);
            }

            // Combine and display results
            this.displaySearchResults(query, nameResults, contentResults);
            this.showSearchLoading(false);

        } catch (error) {
            console.error('Error searching documents:', error);
            this.showError('Search failed');
            this.showSearchLoading(false);
        }
    }

    displaySearchResults(query, nameResults, contentResults) {
        // Clear existing search status
        this.clearSearchResults();

        // Show comprehensive search results
        const searchSection = document.querySelector('.search-section');
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-container';
        
        let totalContentMatches = contentResults.total_matches || 0;
        let documentsWithContent = contentResults.documents_with_matches || 0;
        
        resultsContainer.innerHTML = `
            <div class="search-results-summary">
                <h4>Search Results for "${query}"</h4>
                <div class="search-stats">
                    <span class="stat">📄 ${nameResults.length} documents by name</span>
                    <span class="stat">🔍 ${totalContentMatches} content matches in ${documentsWithContent} documents</span>
                </div>
            </div>
            ${this.renderContentSearchResults(contentResults)}
        `;
        
        searchSection.appendChild(resultsContainer);

        // Update the main document listing to show name-based results
        const categorizedNameResults = {
            opord: nameResults.filter(doc => doc.category === 'opord'),
            warno: nameResults.filter(doc => doc.category === 'warno'),
            intel: nameResults.filter(doc => doc.category === 'intel')
        };

        Object.keys(categorizedNameResults).forEach(category => {
            this.renderCategoryDocuments(category, categorizedNameResults[category]);
            this.updateFileCount(category, categorizedNameResults[category].length);
        });
    }

    renderContentSearchResults(contentResults) {
        if (!contentResults.results || contentResults.results.length === 0) {
            return '<div class="no-content-results">No content matches found</div>';
        }

        let html = '<div class="content-search-results"><h5>Documents with Content Matches:</h5>';
        
        contentResults.results.forEach(result => {
            const doc = result.document;
            const matches = result.total_matches;
            const pages = result.search_results.map(sr => sr.page).join(', ');
            
            html += `
                <div class="content-result-item" onclick="loadDocumentAndHighlight(${doc.id}, '${contentResults.search_term}')">
                    <div class="content-result-header">
                        <span class="content-result-name">${doc.original_name}</span>
                        <span class="content-result-matches">${matches} matches</span>
                    </div>
                    <div class="content-result-meta">
                        <span class="content-result-category">${doc.category.toUpperCase()}</span>
                        <span class="content-result-pages">Pages: ${pages}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    showSearchLoading(show) {
        const searchBtn = document.getElementById('search-btn');
        if (show) {
            searchBtn.innerHTML = '<span class="spinner"></span>';
            searchBtn.disabled = true;
        } else {
            searchBtn.innerHTML = '🔍';
            searchBtn.disabled = false;
        }
    }

    clearSearchResults() {
        const existingResults = document.querySelector('.search-results-container');
        if (existingResults) {
            existingResults.remove();
        }
    }

    showError(message) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.querySelector('.status-text');
        
        statusIndicator.style.backgroundColor = '#e74c3c';
        statusText.textContent = message;
        
        setTimeout(() => {
            statusIndicator.style.backgroundColor = '#27ae60';
            statusText.textContent = 'System Ready';
        }, 3000);
    }

    showSuccess(message) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.querySelector('.status-text');
        
        statusIndicator.style.backgroundColor = '#f39c12';
        statusText.textContent = message;
        
        setTimeout(() => {
            statusIndicator.style.backgroundColor = '#27ae60';
            statusText.textContent = 'System Ready';
        }, 2000);
    }
}

const navigationManager = new NavigationManager();
window.navigationManager = navigationManager;

function toggleSection(category) {
    navigationManager.toggleSection(category);
}

function selectDocument(documentId) {
    console.log('Global selectDocument called with ID:', documentId);
    navigationManager.selectDocument(documentId);
}

function viewDocument(documentId) {
    navigationManager.selectDocument(documentId);
}

function deleteDocument(documentId) {
    navigationManager.deleteDocument(documentId);
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    navigationManager.searchDocuments(query);
}

// Global function to load a document and highlight search terms
window.loadDocumentAndHighlight = async function(documentId, searchTerm) {
    try {
        // Load the document first
        if (navigationManager.currentDocument !== documentId) {
            await navigationManager.loadDocument(documentId);
        }
        
        // Wait a moment for the PDF to load
        setTimeout(() => {
            if (window.searchCurrentPDF) {
                window.searchCurrentPDF(searchTerm);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error loading document and highlighting:', error);
    }
};