function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

function zoomIn() {
    pdfService.zoomIn();
}

function zoomOut() {
    pdfService.zoomOut();
}

function fitToWidth() {
    pdfService.fitToWidth();
}

function toggleFullscreen() {
    pdfService.toggleFullscreen();
}

function previousPage() {
    pdfService.previousPage();
}

function nextPage() {
    pdfService.nextPage();
}

function goToPage(pageNum) {
    pdfService.goToPage(pageNum);
}

document.addEventListener('keydown', function(event) {
    if (!pdfService.currentPDF) return;
    
    switch(event.key) {
        case 'ArrowLeft':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                previousPage();
            }
            break;
        case 'ArrowRight':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                nextPage();
            }
            break;
        case 'ArrowUp':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                zoomIn();
            }
            break;
        case 'ArrowDown':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                zoomOut();
            }
            break;
        case 'f':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                toggleFullscreen();
            }
            break;
        case '0':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                fitToWidth();
            }
            break;
    }
});

document.addEventListener('fullscreenchange', function() {
    const viewer = document.getElementById('pdf-viewer');
    if (!document.fullscreenElement) {
        viewer.classList.remove('fullscreen-viewer');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    pdfService.showWelcomeMessage();
});