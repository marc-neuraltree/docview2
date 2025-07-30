class APIService {
    constructor() {
        this.baseURL = '/api';
    }

    async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async getDocuments(category = null, search = null) {
        let url = '/documents/';
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        return this.request(url);
    }

    async getDocumentsByCategory(category) {
        return this.request(`/documents/${category}`);
    }

    async getDocument(documentId) {
        return this.request(`/documents/doc/${documentId}`);
    }

    async getDocumentContent(documentId) {
        return this.request(`/documents/doc/${documentId}/content`);
    }

    async getDocumentPreview(documentId, page) {
        return this.request(`/documents/doc/${documentId}/preview/${page}`);
    }

    async deleteDocument(documentId) {
        return this.request(`/documents/doc/${documentId}`, {
            method: 'DELETE'
        });
    }

    async scanDirectories() {
        return this.request('/documents/scan-directories', {
            method: 'POST'
        });
    }

    async scanCategoryDirectory(category) {
        return this.request(`/documents/scan-directories/${category}`, {
            method: 'POST'
        });
    }

    async searchDocuments(query) {
        return this.request(`/documents/?search=${encodeURIComponent(query)}`);
    }

    async checkHealth() {
        return this.request('/health');
    }
}

const apiService = new APIService();