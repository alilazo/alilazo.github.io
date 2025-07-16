class ImageCostCalculator {
    constructor() {
        this.currentImage = null;
        this.aspectRatio = 1;
        this.costPerSqIn = 0.035; // Static cost
        this.maxWidth = 13; // Maximum width in inches
        this.maxHeight = 15; // Maximum height in inches
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadButton = document.getElementById('uploadButton');
        this.fileInput = document.getElementById('fileInput');
        this.imageSection = document.getElementById('imageSection');
        this.costSection = document.getElementById('costSection');
        this.previewImage = document.getElementById('previewImage');
        this.imageSize = document.getElementById('imageSize');
        this.sizeDisplay = document.getElementById('sizeDisplay');
        this.widthDisplay = document.getElementById('widthDisplay');
        this.heightDisplay = document.getElementById('heightDisplay');
        this.areaDisplay = document.getElementById('areaDisplay');
        this.costAmount = document.getElementById('costAmount');
        this.costBreakdown = document.getElementById('costBreakdown');
        this.resetButton = document.getElementById('resetButton');
        this.addToCartButton = document.getElementById('addToCartButton');
        this.quantityInput = document.getElementById('quantity');
        
        // Current image data for cart
        this.currentImageData = null;
    }

    bindEvents() {
        // File input events
        this.uploadButton.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        // Size control events
        this.imageSize.addEventListener('input', () => this.updateDimensions());

        // Reset button
        this.resetButton.addEventListener('click', () => this.resetCalculator());

        // Add to cart button
        if (this.addToCartButton) {
            this.addToCartButton.addEventListener('click', () => this.addToCart());
        }

        // Prevent default drag behaviors on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        if (!this.uploadArea.contains(e.relatedTarget)) {
            this.uploadArea.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processFile(file);
        }
    }

    processFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.aspectRatio = img.width / img.height;
                this.currentImageData = {
                    name: file.name,
                    imageUrl: e.target.result,
                    originalWidth: img.width,
                    originalHeight: img.height
                };
                this.displayImage(e.target.result);
                this.calculateMaxSize();
                this.showImageControls();
                this.updateDimensions();
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    displayImage(src) {
        this.previewImage.src = src;
        this.previewImage.onload = () => {
            this.imageSection.style.display = 'block';
        };
    }

    showImageControls() {
        // Reset the size slider to default
        this.imageSize.value = 10;
        this.updateDimensions();
    }

    calculateMaxSize() {
        // Calculate the maximum size based on width and height constraints
        let maxSizeByWidth, maxSizeByHeight;
        
        if (this.aspectRatio >= 1) {
            // Landscape or square - width is the limiting factor
            maxSizeByWidth = this.maxWidth;
            maxSizeByHeight = this.maxHeight * this.aspectRatio;
        } else {
            // Portrait - height is the limiting factor
            maxSizeByWidth = this.maxWidth / this.aspectRatio;
            maxSizeByHeight = this.maxHeight;
        }
        
        this.maxSize = Math.min(maxSizeByWidth, maxSizeByHeight);
        
        // Update the slider max value
        this.imageSize.max = this.maxSize.toFixed(1);
        
        // If current value exceeds max, adjust it
        if (parseFloat(this.imageSize.value) > this.maxSize) {
            this.imageSize.value = this.maxSize.toFixed(1);
        }
    }

    updateDimensions() {
        const size = parseFloat(this.imageSize.value);
        
        // Calculate width and height based on aspect ratio
        let width, height;
        if (this.aspectRatio >= 1) {
            // Landscape or square
            width = size;
            height = size / this.aspectRatio;
        } else {
            // Portrait
            height = size;
            width = size * this.aspectRatio;
        }

        // Ensure dimensions don't exceed maximum constraints
        if (width > this.maxWidth) {
            width = this.maxWidth;
            height = width / this.aspectRatio;
            size = width;
        }
        if (height > this.maxHeight) {
            height = this.maxHeight;
            width = height * this.aspectRatio;
            size = this.aspectRatio >= 1 ? width : height;
        }

        // Update displays
        this.sizeDisplay.textContent = `${size.toFixed(1)}"`;
        this.widthDisplay.textContent = `${width.toFixed(1)}"`;
        this.heightDisplay.textContent = `${height.toFixed(1)}"`;
        
        const area = width * height;
        this.areaDisplay.textContent = `${area.toFixed(1)} sq in`;

        // Update cost
        this.updateCost();
        
        // Show cost section
        this.costSection.style.display = 'block';
    }

    updateCost() {
        if (!this.currentImage) return;

        const size = parseFloat(this.imageSize.value);
        
        // Calculate dimensions
        let width, height;
        if (this.aspectRatio >= 1) {
            width = size;
            height = size / this.aspectRatio;
        } else {
            height = size;
            width = size * this.aspectRatio;
        }

        // Ensure dimensions don't exceed maximum constraints
        if (width > this.maxWidth) {
            width = this.maxWidth;
            height = width / this.aspectRatio;
        }
        if (height > this.maxHeight) {
            height = this.maxHeight;
            width = height * this.aspectRatio;
        }

        const area = width * height;
        const totalCost = area * this.costPerSqIn;

        // Update cost display
        this.costAmount.textContent = `$${totalCost.toFixed(2)}`;
        this.costBreakdown.textContent = `${area.toFixed(1)} sq in × $${this.costPerSqIn.toFixed(3)} = $${totalCost.toFixed(2)}`;
        
        // Update current image data for cart
        if (this.currentImageData) {
            this.currentImageData.width = width;
            this.currentImageData.height = height;
            this.currentImageData.area = area;
            this.currentImageData.cost = totalCost;
        }
    }

    addToCart() {
        if (!this.currentImageData || !window.cartManager) {
            console.error('Cart manager not available or no image data');
            return;
        }

        const quantity = parseInt(this.quantityInput.value) || 1;
        
        // Add the specified quantity to cart
        for (let i = 0; i < quantity; i++) {
            // Use the same image data for all copies (they will be grouped)
            window.cartManager.addToCart(this.currentImageData, i === quantity - 1);
        }
        
        // Show custom message for quantity
        if (quantity > 1) {
            window.cartManager.showAddToCartMessage(quantity);
        }
        
        // Reset quantity to 1 after adding
        this.quantityInput.value = 1;
    }

    resetCalculator() {
        this.currentImage = null;
        this.aspectRatio = 1;
        this.fileInput.value = '';
        this.imageSection.style.display = 'none';
        this.costSection.style.display = 'none';
        this.uploadArea.classList.remove('dragover');
        
        // Reset slider to default values
        this.imageSize.max = 50;
        this.imageSize.value = 10;
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDimension(dimension) {
        return `${dimension.toFixed(1)}"`;
    }

    formatArea(area) {
        return `${area.toFixed(1)} sq in`;
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageCostCalculator();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
