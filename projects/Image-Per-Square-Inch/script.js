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
            console.log('Add to Cart button found, adding event listener');
            this.addToCartButton.addEventListener('click', () => this.addToCart());
        } else {
            console.error('Add to Cart button not found!');
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

    async processFile(file) {
        // Show uploading message
        this.showUploadingMessage();
        
        try {
            // Upload to ImgBB first
            const imgbbUrl = await this.uploadToImgBB(file);
            
            // Create image object to get dimensions
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.aspectRatio = img.width / img.height;
                this.currentImageData = {
                    name: file.name,
                    imageUrl: imgbbUrl, // Use ImgBB URL instead of data URL
                    originalWidth: img.width,
                    originalHeight: img.height
                };
                this.displayImage(imgbbUrl); // Display ImgBB URL
                this.calculateMaxSize();
                this.showImageControls();
                this.updateDimensions();
                this.hideUploadingMessage();
            };
            img.src = imgbbUrl;
            
        } catch (error) {
            console.error('Error uploading to ImgBB:', error);
            this.hideUploadingMessage();
            
            // Fallback to original method if ImgBB fails
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
    }

    async uploadToImgBB(file) {
        const API_KEY = '7b482fa896250425780bc2a5d12996ab';
        
        // Create form data for ImgBB
        const formData = new FormData();
        formData.append('image', file);
        formData.append('name', file.name.replace(/[^a-zA-Z0-9]/g, '_'));
        
        // Upload to ImgBB
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            return result.data.url; // Return the ImgBB URL
        } else {
            throw new Error(`Upload failed: ${result.error?.message || 'Unknown error'}`);
        }
    }

    showUploadingMessage() {
        // Create uploading message
        const message = document.createElement('div');
        message.id = 'uploadingMessage';
        message.className = 'uploading-message';
        message.innerHTML = `
            <div class="upload-content">
                <div class="upload-spinner"></div>
                <div class="upload-text">
                    <strong>Uploading to ImgBB...</strong>
                    <p>Converting image for optimal storage and performance</p>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            border: 2px solid #3498db;
            border-radius: 15px;
            padding: 2rem;
            z-index: 1001;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
        `;

        // Add spinner styles
        const style = document.createElement('style');
        style.id = 'uploadingStyles';
        style.textContent = `
            .upload-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .upload-text strong {
                color: #3498db;
                font-size: 1.1rem;
                display: block;
                margin-bottom: 0.5rem;
            }
            .upload-text p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'uploadingBackdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(message);
    }

    hideUploadingMessage() {
        const message = document.getElementById('uploadingMessage');
        const backdrop = document.getElementById('uploadingBackdrop');
        const styles = document.getElementById('uploadingStyles');
        
        if (message && message.parentNode) {
            document.body.removeChild(message);
        }
        if (backdrop && backdrop.parentNode) {
            document.body.removeChild(backdrop);
        }
        if (styles && styles.parentNode) {
            document.head.removeChild(styles);
        }
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
        console.log('Add to Cart button clicked');
        console.log('Current image data:', this.currentImageData);
        console.log('Cart manager available:', !!window.cartManager);
        
        if (!this.currentImageData || !window.cartManager) {
            console.error('Cart manager not available or no image data');
            return;
        }

        const quantity = parseInt(this.quantityInput.value) || 1;
        console.log('Quantity to add:', quantity);
        
        // Add the item once with the specified quantity
        // The cart manager will handle grouping identical items
        const success = window.cartManager.addToCart(this.currentImageData, false); // Don't show message yet
        
        if (success && quantity > 1) {
            // If we successfully added the item and quantity > 1, 
            // manually update the quantity to the desired amount
            const cartItem = window.cartManager.cart.find(item => 
                item.imageKey === `${this.currentImageData.name}_${this.currentImageData.width}_${this.currentImageData.height}`
            );
            
            if (cartItem) {
                cartItem.quantity = quantity;
                window.cartManager.saveCart();
                if (document.getElementById('cartItems')) {
                    window.cartManager.renderCart();
                }
            }
        }
        
        // Show success message (only once)
        if (success) {
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
