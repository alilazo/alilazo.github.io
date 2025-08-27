// Cart management functionality
class CartManager {
    constructor() {
        // Clear localStorage on page refresh to fix cart issues
        this.handlePageRefresh();
        
        this.cart = this.loadCart();
        this.costPerSqIn = 0.035;
        this.initializeCart();
        this.updateCartCount();
        
        // Check if this is a preview request
        this.checkForPreview();
    }

    handlePageRefresh() {
        // Check if this is a page refresh (not a new session)
        if (performance.navigation && performance.navigation.type === 1) {
            // Type 1 means the page was reloaded
            console.log('Page refresh detected - clearing localStorage to fix cart issues');
            localStorage.removeItem('imageCart');
        } else if (performance.getEntriesByType && performance.getEntriesByType('navigation').length > 0) {
            // Modern way to check for page refresh
            const navEntry = performance.getEntriesByType('navigation')[0];
            if (navEntry.type === 'reload') {
                console.log('Page reload detected - clearing localStorage to fix cart issues');
                localStorage.removeItem('imageCart');
            }
        }
    }

    initializeCart() {
        if (document.getElementById('cartItems')) {
            this.renderCart();
            // Also bind clear button immediately
            this.bindClearButton();
        }
    }

    bindClearButton() {
        const clearButton = document.getElementById('clearCartButton');
        if (clearButton) {
            // Remove existing event listeners to prevent duplicates
            clearButton.replaceWith(clearButton.cloneNode(true));
            const newClearButton = document.getElementById('clearCartButton');
            newClearButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all items from your cart?')) {
                    this.clearCart();
                }
            });
        }
    }

    loadCart() {
        const saved = localStorage.getItem('imageCart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('imageCart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    addToCart(imageData, showMessage = true) {
        // Create a unique key for grouping identical images
        const imageKey = `${imageData.name}_${imageData.width}_${imageData.height}`;
        
        // Check if this exact image already exists in cart
        const existingItem = this.cart.find(item => 
            item.imageKey === imageKey
        );

        if (existingItem) {
            // Increment quantity of existing item
            existingItem.quantity += 1;
        } else {
            // Add new item with quantity
            const cartItem = {
                id: Date.now() + Math.random(),
                imageKey: imageKey,
                name: imageData.name || `Image ${this.cart.length + 1}`,
                imageUrl: imageData.imageUrl,
                width: imageData.width,
                height: imageData.height,
                area: imageData.area,
                cost: imageData.cost,
                quantity: 1,
                addedAt: new Date().toISOString()
            };
            this.cart.push(cartItem);
        }

        this.saveCart();
        
        // Show success message only if requested
        if (showMessage) {
            this.showAddToCartMessage();
        }
        
        // Re-render cart if on cart page
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }

        return true;
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        
        // Re-render cart if on cart page
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        
        // Re-render cart if on cart page
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
    }

    clearCartAfterEmail() {
        // Clear the cart after email is sent
        this.cart = [];
        this.saveCart();
        
        // Re-render cart if on cart page
        if (document.getElementById('cartItems')) {
            this.renderCart();
        }
        
        // Show confirmation message
        this.showCartClearedMessage();
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const countElements = document.querySelectorAll('#cartCount');
        countElements.forEach(element => {
            element.textContent = totalItems;
        });
    }

    showAddToCartMessage(quantity = 1) {
        // Create and show a temporary success message
        const message = document.createElement('div');
        message.className = 'cart-success-message';
        message.textContent = quantity > 1 ? `${quantity} images added to cart!` : 'Image added to cart!';
        message.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background-color: #28a745;
            color: white;
            padding: 1rem 2rem;
            border-radius: 25px;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            font-weight: 500;
        `;

        // Add animation keyframes if not already present
        if (!document.querySelector('#cartMessageStyles')) {
            const style = document.createElement('style');
            style.id = 'cartMessageStyles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(message);

        // Remove message after 3 seconds
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    renderCart() {
        const emptyCart = document.getElementById('emptyCart');
        const cartItems = document.getElementById('cartItems');
        const cartList = document.getElementById('cartList');

        if (this.cart.length === 0) {
            emptyCart.style.display = 'block';
            cartItems.style.display = 'none';
            return;
        }

        emptyCart.style.display = 'none';
        cartItems.style.display = 'block';

        // Clear existing items
        cartList.innerHTML = '';

        // Render each cart item
        this.cart.forEach(item => {
            const cartItemElement = this.createCartItemElement(item);
            cartList.appendChild(cartItemElement);
        });

        // Update summary
        this.updateCartSummary();

        // Bind events after rendering
        setTimeout(() => this.bindCartEvents(), 10);
    }

    createCartItemElement(item) {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.dataset.itemId = item.id;

        const totalCost = item.cost * item.quantity;

        div.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-specs">
                    <div class="cart-item-spec">Width: ${item.width.toFixed(1)}"</div>
                    <div class="cart-item-spec">Height: ${item.height.toFixed(1)}"</div>
                    <div class="cart-item-spec">Area: ${item.area.toFixed(1)} sq in</div>
                </div>
                <div class="cart-item-pricing">
                    <div class="unit-cost">$${item.cost.toFixed(2)} each</div>
                    <div class="cart-item-cost">$${totalCost.toFixed(2)} total</div>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <label for="qty-${item.id}">Qty:</label>
                    <button class="qty-btn qty-decrease" data-item-id="${item.id}">-</button>
                    <input type="number" class="qty-input" id="qty-${item.id}" value="${item.quantity}" min="1" max="99" data-item-id="${item.id}">
                    <button class="qty-btn qty-increase" data-item-id="${item.id}">+</button>
                </div>
                <button class="remove-item-button" data-item-id="${item.id}">Remove</button>
            </div>
        `;

        return div;
    }

    updateCartSummary() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalArea = this.cart.reduce((sum, item) => sum + (item.area * item.quantity), 0);
        const totalCost = this.cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalArea').textContent = `${totalArea.toFixed(1)} sq in`;
        document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
    }

    bindCartEvents() {
        // Remove item buttons
        document.querySelectorAll('.remove-item-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseFloat(e.target.dataset.itemId);
                this.removeFromCart(itemId);
            });
        });

        // Quantity controls
        document.querySelectorAll('.qty-decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseFloat(e.target.dataset.itemId);
                this.decreaseQuantity(itemId);
            });
        });

        document.querySelectorAll('.qty-increase').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = parseFloat(e.target.dataset.itemId);
                this.increaseQuantity(itemId);
            });
        });

        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const itemId = parseFloat(e.target.dataset.itemId);
                const newQuantity = parseInt(e.target.value) || 1;
                this.updateQuantity(itemId, newQuantity);
            });
        });

        // Email cart button
        const emailButton = document.getElementById('emailCartButton');
        if (emailButton) {
            emailButton.addEventListener('click', () => {
                this.sendCartEmail();
            });
        }

        // Clear cart button
        this.bindClearButton();
    }

    updateQuantity(itemId, newQuantity) {
        const item = this.cart.find(item => item.id === itemId);
        if (item && newQuantity >= 1 && newQuantity <= 99) {
            item.quantity = newQuantity;
            this.saveCart();
            this.renderCart();
        }
    }

    increaseQuantity(itemId) {
        const item = this.cart.find(item => item.id === itemId);
        if (item && item.quantity < 99) {
            item.quantity += 1;
            this.saveCart();
            this.renderCart();
        }
    }

    decreaseQuantity(itemId) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                this.saveCart();
                this.renderCart();
            } else {
                // If quantity would be 0, remove the item
                this.removeFromCart(itemId);
            }
        }
    }

    getCartData() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalArea = this.cart.reduce((sum, item) => sum + (item.area * item.quantity), 0);
        const totalCost = this.cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
        
        return {
            items: this.cart,
            totalItems: totalItems,
            totalArea: totalArea,
            totalCost: totalCost
        };
    }

    async sendCartEmail() {
        if (this.cart.length === 0) {
            alert('Your cart is empty. Add some images before sending an email.');
            return;
        }

        // Show uploading progress
        this.showUploadingMessage();

        try {
            // Upload all images to ImgBB
            const uploadedImages = await this.uploadImagesToImgBB();
            
            // Hide uploading message
            this.hideUploadingMessage();
            
            // Create email with uploaded image links
            this.createAndSendEmail(uploadedImages);
            
        } catch (error) {
            console.error('Error uploading images:', error);
            this.hideUploadingMessage();
            
            // Fallback to manual upload instructions
            this.createAndSendEmailWithManualUpload();
        }
    }

    async uploadImagesToImgBB() {
        const API_KEY = '7b482fa896250425780bc2a5d12996ab';
        const uploadedImages = [];
        
        for (let i = 0; i < this.cart.length; i++) {
            const item = this.cart[i];
            this.updateUploadProgress(i + 1, this.cart.length, item.name);
            
            try {
                // Convert image URL to blob
                const response = await fetch(item.imageUrl);
                const blob = await response.blob();
                
                // Create form data for ImgBB
                const formData = new FormData();
                formData.append('image', blob);
                formData.append('name', item.name.replace(/[^a-zA-Z0-9]/g, '_'));
                
                // Upload to ImgBB
                const uploadResponse = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                
                const uploadResult = await uploadResponse.json();
                
                if (uploadResult.success) {
                    uploadedImages.push({
                        name: item.name,
                        url: uploadResult.data.url,
                        directUrl: uploadResult.data.image.url,
                        item: item
                    });
                } else {
                    throw new Error(`Upload failed for ${item.name}: ${uploadResult.error?.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error(`Failed to upload ${item.name}:`, error);
                throw error;
            }
        }
        
        return uploadedImages;
    }

    createAndSendEmail(uploadedImages) {
        const cartData = this.getCartData();
        const orderDate = new Date().toLocaleDateString();
        const orderTime = new Date().toLocaleTimeString();
        
        // Create email subject
        const subject = `Image Printing Order - ${cartData.totalItems} Items - ${orderDate}`;
        
        // Create detailed email body
        let emailBody = 'Hello HomeTown Graphics,\n\n';
        emailBody += 'I would like to place a custom image printing order. Please find all details below:\n\n';
        
        emailBody += '=== ORDER INFORMATION ===\n';
        emailBody += `Order Date: ${orderDate} at ${orderTime}\n`;
        emailBody += `Total Items: ${cartData.totalItems}\n`;
        emailBody += `Total Print Area: ${cartData.totalArea.toFixed(2)} square inches\n`;
        emailBody += `Estimated Cost: $${cartData.totalCost.toFixed(2)}\n`;
        emailBody += `Order ID: IMG-${Date.now().toString().slice(-6)}\n\n`;
        
        emailBody += '=== DETAILED ITEM BREAKDOWN ===\n';
        cartData.items.forEach((item, index) => {
            const uploadedImage = uploadedImages.find(img => img.item.id === item.id);
            emailBody += `ITEM ${index + 1}: ${item.name}\n`;
            emailBody += `  • Width: ${item.width.toFixed(2)} inches\n`;
            emailBody += `  • Height: ${item.height.toFixed(2)} inches\n`;
            emailBody += `  • Print Area per Item: ${item.area.toFixed(2)} sq in\n`;
            emailBody += `  • Quantity: ${item.quantity} piece(s)\n`;
            emailBody += `  • Unit Cost: $${item.cost.toFixed(2)} each\n`;
            emailBody += `  • Line Total: $${(item.cost * item.quantity).toFixed(2)}\n`;
            emailBody += `  • Total Area for Item: ${(item.area * item.quantity).toFixed(2)} sq in\n`;
            emailBody += `  • Image Link: ${uploadedImage ? uploadedImage.url : 'Upload failed'}\n`;
            emailBody += `  • Direct Download: ${uploadedImage ? uploadedImage.directUrl : 'Upload failed'}\n\n`;
        });
        
        emailBody += '=== IMAGE GALLERY ===\n';
        emailBody += 'All images automatically uploaded to ImgBB:\n';
        uploadedImages.forEach((img, index) => {
            emailBody += `${index + 1}. ${img.name}\n`;
            emailBody += `   View Page: ${img.url}\n`;
            emailBody += `   Direct Link: ${img.directUrl}\n\n`;
        });
        
        emailBody += '=== ORDER SPECIFICATIONS ===\n';
        emailBody += '• Background Removal: All images uploaded without backgrounds as required\n';
        emailBody += '• Aspect Ratio: Original proportions maintained\n';
        emailBody += '• Image Quality: High resolution preserved via ImgBB hosting\n';
        emailBody += '• Pricing Rate: $0.035 per square inch\n';
        emailBody += '• File Format: Images converted to web-compatible formats\n';
        emailBody += '• Order Method: Calculated via Image Cost Calculator tool\n\n';
        
        emailBody += '=== VERIFICATION ===\n';
        emailBody += 'Click the link below to preview this order with all details:\n';
        const verificationLink = 'https://amadolazo.com/projects/Image-Per-Square-Inch/index.html?preview=true&orderId=IMG-' + Date.now().toString().slice(-6) + '&items=' + encodeURIComponent(JSON.stringify(cartData.items)) + '&totalItems=' + cartData.totalItems + '&totalArea=' + cartData.totalArea.toFixed(2) + '&totalCost=' + cartData.totalCost.toFixed(2) + '&orderDate=' + encodeURIComponent(orderDate) + '&orderTime=' + encodeURIComponent(orderTime) + '&hasImages=true&imageLinks=' + encodeURIComponent(JSON.stringify(uploadedImages.map(img => ({ name: img.name, url: img.url, directUrl: img.directUrl }))));
        emailBody += 'Verification Link: ' + verificationLink + '\n\n';
        
        emailBody += '=== NEXT STEPS ===\n';
        emailBody += 'Please review this order and expect a confirmation of:\n';
        emailBody += '1. Current pricing rates and any bulk discounts\n';
        emailBody += '2. Production timeline and delivery options\n';
        emailBody += '3. Payment methods accepted\n';
        emailBody += '4. Any additional requirements or specifications\n\n';
        
        emailBody += 'I look forward to working with you on this project!\n\n';

        // Create mailto link
        const mailtoLink = `mailto:hometowngraphics22@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Primary attempt: Open email client
        try {
            window.location.href = mailtoLink;
            
            // Set a timeout to check if email opened successfully
            setTimeout(() => {
                this.showEmailFailsafe(subject, emailBody, true);
            }, 2000);
            
            // Show success message (but don't clear cart yet)
            this.showEmailSentMessage(true);
        } catch (error) {
            console.error('Error opening email client:', error);
            // Immediate failsafe if error occurs
            this.showEmailFailsafe(subject, emailBody, true);
        }
    }

    createAndSendEmailWithManualUpload() {
        const cartData = this.getCartData();
        const orderDate = new Date().toLocaleDateString();
        const orderTime = new Date().toLocaleTimeString();
        
        // Create email subject
        const subject = `Image Printing Order - ${cartData.totalItems} Items - ${orderDate}`;
        
        // Create detailed email body (fallback version)
        let emailBody = 'Hello HomeTown Graphics,\n\n';
        emailBody += 'I would like to place a custom image printing order. Please find all details below:\n\n';
        
        emailBody += '=== ORDER INFORMATION ===\n';
        emailBody += `Order Date: ${orderDate} at ${orderTime}\n`;
        emailBody += `Total Items: ${cartData.totalItems}\n`;
        emailBody += `Total Print Area: ${cartData.totalArea.toFixed(2)} square inches\n`;
        emailBody += `Estimated Cost: $${cartData.totalCost.toFixed(2)} (at $0.035 per sq in)\n`;
        emailBody += `Order ID: IMG-${Date.now().toString().slice(-6)}\n\n`;
        
        emailBody += '=== DETAILED ITEM BREAKDOWN ===\n';
        cartData.items.forEach((item, index) => {
            emailBody += `ITEM ${index + 1}: ${item.name}\n`;
            emailBody += `  • Width: ${item.width.toFixed(2)} inches\n`;
            emailBody += `  • Height: ${item.height.toFixed(2)} inches\n`;
            emailBody += `  • Print Area per Item: ${item.area.toFixed(2)} sq in\n`;
            emailBody += `  • Quantity: ${item.quantity} piece(s)\n`;
            emailBody += `  • Unit Cost: $${item.cost.toFixed(2)} each\n`;
            emailBody += `  • Line Total: $${(item.cost * item.quantity).toFixed(2)}\n`;
            emailBody += `  • Total Area for Item: ${(item.area * item.quantity).toFixed(2)} sq in\n\n`;
        });
        
        emailBody += '=== IMAGE UPLOAD REQUIRED ===\n';
        emailBody += 'Automatic upload failed. Please upload images manually:\n\n';
        emailBody += 'RECOMMENDED UPLOAD SERVICE:\n';
        emailBody += '• ImgBB.com (no registration required)\n';
        emailBody += '• Drag & drop your images\n';
        emailBody += '• Copy the provided links\n';
        emailBody += '• Paste links below:\n\n';
        
        emailBody += 'IMAGE LINKS TO PASTE:\n';
        cartData.items.forEach((item, index) => {
            emailBody += `${index + 1}. ${item.name}: [PASTE IMGBB LINK HERE]\n`;
        });
        emailBody += '\n';
        
        emailBody += '=== VERIFICATION ===\n';
        emailBody += 'Click the link below to preview this order with all details:\n';
        const verificationLinkManual = 'https://amadolazo.com/projects/Image-Per-Square-Inch/index.html?preview=true&orderId=IMG-' + Date.now().toString().slice(-6) + '&items=' + encodeURIComponent(JSON.stringify(cartData.items)) + '&totalItems=' + cartData.totalItems + '&totalArea=' + cartData.totalArea.toFixed(2) + '&totalCost=' + cartData.totalCost.toFixed(2) + '&orderDate=' + encodeURIComponent(orderDate) + '&orderTime=' + encodeURIComponent(orderTime) + '&hasImages=false';
        emailBody += 'Verification Link: ' + verificationLinkManual + '\n\n';
        
        emailBody += '=== ORDER SPECIFICATIONS ===\n';
        emailBody += '• Background Removal: All images uploaded without backgrounds as required\n';
        emailBody += '• Aspect Ratio: Original proportions maintained\n';
        emailBody += '• Image Quality: High resolution (please maintain quality when uploading)\n';
        emailBody += '• Pricing Rate: $0.035 per square inch\n';
        emailBody += '• File Format: Original formats preserved\n';
        emailBody += '• Order Method: Calculated via HTGDesigns Cost Calculator tool\n\n';
        
        emailBody += '=== NEXT STEPS ===\n';
        emailBody += 'Please review this order and confirm:\n';
        emailBody += '1. Upload images using links above\n';
        emailBody += '2. Current pricing rates and any bulk discounts\n';
        emailBody += '3. Production timeline and delivery options\n';
        emailBody += '4. Payment methods accepted\n\n';
        
        emailBody += 'I look forward to working with you on this project!\n\n';

        // Create mailto link
        const mailtoLink = `mailto:hometowngraphics22@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Primary attempt: Open email client
        try {
            window.location.href = mailtoLink;
            
            // Set a timeout to check if email opened successfully
            setTimeout(() => {
                this.showEmailFailsafe(subject, emailBody, false);
            }, 2000);
            
            // Show fallback message (but don't clear cart yet)
            this.showEmailSentMessage(false);
        } catch (error) {
            console.error('Error opening email client:', error);
            // Immediate failsafe if error occurs
            this.showEmailFailsafe(subject, emailBody, false);
        }
    }

    showUploadingMessage() {
        const message = document.createElement('div');
        message.id = 'uploadingMessage';
        message.className = 'uploading-message';
        message.innerHTML = `
            <div class="upload-content">
                <div class="upload-spinner"></div>
                <div class="upload-text">
                    <strong>Uploading Images...</strong>
                    <p id="uploadProgress">Preparing to upload...</p>
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

    updateUploadProgress(current, total, imageName) {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            progressElement.textContent = `Uploading ${current} of ${total}: ${imageName}`;
        }
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

    showEmailFailsafe(subject, emailBody, hasImages) {
        const message = document.createElement('div');
        message.className = 'email-failsafe-modal';
        message.innerHTML = `
            <div class="failsafe-content">
                <div class="failsafe-header">
                    <button class="close-failsafe-x" id="closeFailsafeX">×</button>
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9,12 2,2 4,-4"></path>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                    <h3>Email Backup Options</h3>
                    <p>If your email client didn't open automatically, use these backup methods:</p>
                </div>
                
                <div class="failsafe-options">
                    <div class="option-card">
                        <h4>📋 Option 1: Copy to Clipboard</h4>
                        <p>Copy the complete email content and paste it manually into your email client.</p>
                        <button class="copy-email-btn" id="copyEmailBtn">Copy Complete Email</button>
                    </div>
                    
                    <div class="option-card">
                        <h4>📧 Option 2: Manual Email Setup</h4>
                        <p>Use these details to create the email manually:</p>
                        <div class="manual-details">
                            <div class="detail-row">
                                <strong>To:</strong> 
                                <span class="selectable-text">hometowngraphics22@gmail.com</span>
                                <button class="copy-btn" onclick="navigator.clipboard.writeText('hometowngraphics22@gmail.com')">Copy</button>
                            </div>
                            <div class="detail-row">
                                <strong>Subject:</strong> 
                                <span class="selectable-text">${subject}</span>
                                <button class="copy-btn" onclick="navigator.clipboard.writeText('${subject.replace(/'/g, "\\'")}')">Copy</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="option-card">
                        <h4>🌐 Option 3: Web Email Services</h4>
                        <p>Open your web email and use the copy options above:</p>
                        <div class="web-email-links">
                            <a href="https://mail.google.com/mail/u/0/#inbox?compose=new" target="_blank" class="email-link">Gmail</a>
                            <a href="https://outlook.live.com/mail/0/inbox" target="_blank" class="email-link">Outlook</a>
                            <a href="https://mail.yahoo.com/d/compose" target="_blank" class="email-link">Yahoo Mail</a>
                        </div>
                    </div>
                    
                    <div class="option-card">
                        <h4>📱 Option 4: View Full Email</h4>
                        <p>View the complete email content for manual copying:</p>
                        <button class="view-email-btn" id="viewEmailBtn">View Full Email Content</button>
                    </div>
                </div>
                
                <div class="failsafe-actions">
                    <button class="try-again-btn" id="tryAgainBtn">Try Email Client Again</button>
                    <button class="close-failsafe-btn" id="closeFailsafeBtn">Close</button>
                </div>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1002;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        // Add comprehensive styles for the failsafe modal
        const style = document.createElement('style');
        style.id = 'failsafeStyles';
        style.textContent = `
            .failsafe-content {
                background-color: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            .failsafe-header {
                text-align: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #f0f0f0;
                position: relative;
            }
            .failsafe-header .close-failsafe-x {
                position: absolute;
                top: -10px;
                right: -10px;
                background: #dc3545;
                color: white;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.3s ease;
                z-index: 1;
            }
            .failsafe-header .close-failsafe-x:hover {
                background: #c82333;
            }
            .failsafe-header .info-icon {
                width: 48px;
                height: 48px;
                color: #3498db;
                margin: 0 auto 1rem auto;
                display: block;
            }
            .failsafe-header h3 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1.5rem;
            }
            .failsafe-header p {
                margin: 0;
                color: #666;
                font-size: 1rem;
            }
            .failsafe-options {
                display: grid;
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            .option-card {
                border: 2px solid #e9ecef;
                border-radius: 10px;
                padding: 1.5rem;
                transition: border-color 0.3s ease;
            }
            .option-card:hover {
                border-color: #3498db;
            }
            .option-card h4 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1.1rem;
            }
            .option-card p {
                margin: 0 0 1rem 0;
                color: #666;
                line-height: 1.4;
            }
            .copy-email-btn, .view-email-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.3s ease;
                width: 100%;
            }
            .copy-email-btn:hover, .view-email-btn:hover {
                background-color: #2980b9;
            }
            .manual-details {
                background-color: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
            }
            .detail-row {
                display: flex;
                align-items: center;
                margin-bottom: 0.75rem;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            .detail-row:last-child {
                margin-bottom: 0;
            }
            .detail-row strong {
                min-width: 70px;
                color: #333;
            }
            .selectable-text {
                flex: 1;
                background-color: #fff;
                padding: 0.5rem;
                border-radius: 4px;
                border: 1px solid #ddd;
                font-family: monospace;
                font-size: 0.9rem;
                word-break: break-all;
            }
            .copy-btn {
                background-color: #28a745;
                color: white;
                border: none;
                padding: 0.4rem 0.8rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: background-color 0.3s ease;
            }
            .copy-btn:hover {
                background-color: #218838;
            }
            .web-email-links {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-top: 1rem;
            }
            .email-link {
                background-color: #6c757d;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            .email-link:hover {
                background-color: #5a6268;
                text-decoration: none;
            }
            .failsafe-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                padding-top: 1rem;
                border-top: 2px solid #f0f0f0;
            }
            .try-again-btn {
                background-color: #ffc107;
                color: #212529;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            .try-again-btn:hover {
                background-color: #e0a800;
            }
            .close-failsafe-btn {
                background-color: #6c757d;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            .close-failsafe-btn:hover {
                background-color: #5a6268;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            @media (max-width: 768px) {
                .failsafe-content {
                    padding: 1.5rem;
                }
                .detail-row {
                    flex-direction: column;
                    align-items: stretch;
                }
                .failsafe-actions {
                    flex-direction: column;
                }
                .web-email-links {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(message);

        // Event listeners for failsafe options
        document.getElementById('copyEmailBtn').addEventListener('click', () => {
            const fullEmail = `To: hometowngraphics22@gmail.com\nSubject: ${subject}\n\n${emailBody}`;
            navigator.clipboard.writeText(fullEmail).then(() => {
                alert('Complete email copied to clipboard! Paste it into your email client.');
            }).catch(() => {
                this.showEmailContentModal(subject, emailBody);
            });
        });

        document.getElementById('viewEmailBtn').addEventListener('click', () => {
            this.showEmailContentModal(subject, emailBody);
        });

        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            const mailtoLink = `mailto:hometowngraphics22@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
            window.location.href = mailtoLink;
        });

        document.getElementById('closeFailsafeBtn').addEventListener('click', () => {
            document.body.removeChild(message);
            const styles = document.getElementById('failsafeStyles');
            if (styles) document.head.removeChild(styles);
            // Clear cart when user closes the modal
            this.clearCartAfterEmail();
        });

        // Add event listener for the X button
        document.getElementById('closeFailsafeX').addEventListener('click', () => {
            document.body.removeChild(message);
            const styles = document.getElementById('failsafeStyles');
            if (styles) document.head.removeChild(styles);
            // Clear cart when user closes the modal
            this.clearCartAfterEmail();
        });
    }

    showEmailContentModal(subject, emailBody) {
        const modal = document.createElement('div');
        modal.className = 'email-content-modal';
        modal.innerHTML = `
            <div class="email-content-wrapper">
                <div class="email-content-header">
                    <h3>Complete Email Content</h3>
                    <button class="close-content-btn" id="closeContentBtn">×</button>
                </div>
                <div class="email-content-body">
                    <div class="email-field">
                        <label><strong>To:</strong></label>
                        <div class="email-value">hometowngraphics22@gmail.com</div>
                    </div>
                    <div class="email-field">
                        <label><strong>Subject:</strong></label>
                        <div class="email-value">${subject}</div>
                    </div>
                    <div class="email-field">
                        <label><strong>Message:</strong></label>
                        <textarea class="email-message" readonly>${emailBody}</textarea>
                    </div>
                </div>
                <div class="email-content-actions">
                    <button class="select-all-btn" id="selectAllBtn">Select All Text</button>
                    <button class="copy-all-btn" id="copyAllBtn">Copy All</button>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 1003;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const contentStyle = document.createElement('style');
        contentStyle.textContent = `
            .email-content-wrapper {
                background-color: white;
                border-radius: 10px;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .email-content-header {
                padding: 1.5rem;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .email-content-header h3 {
                margin: 0;
                color: #333;
            }
            .close-content-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .email-content-body {
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1;
            }
            .email-field {
                margin-bottom: 1rem;
            }
            .email-field label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
            }
            .email-value {
                background-color: #f8f9fa;
                padding: 0.75rem;
                border-radius: 6px;
                border: 1px solid #ddd;
                font-family: monospace;
            }
            .email-message {
                width: 100%;
                min-height: 300px;
                padding: 1rem;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-family: monospace;
                font-size: 0.9rem;
                line-height: 1.4;
                resize: vertical;
            }
            .email-content-actions {
                padding: 1rem 1.5rem;
                border-top: 1px solid #ddd;
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            .select-all-btn, .copy-all-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.3s ease;
            }
            .select-all-btn {
                background-color: #6c757d;
                color: white;
            }
            .select-all-btn:hover {
                background-color: #5a6268;
            }
            .copy-all-btn {
                background-color: #28a745;
                color: white;
            }
            .copy-all-btn:hover {
                background-color: #218838;
            }
        `;
        document.head.appendChild(contentStyle);
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('closeContentBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(contentStyle);
        });

        document.getElementById('selectAllBtn').addEventListener('click', () => {
            const textarea = modal.querySelector('.email-message');
            textarea.select();
            textarea.setSelectionRange(0, 99999);
        });

        document.getElementById('copyAllBtn').addEventListener('click', () => {
            const fullEmail = `To: hometowngraphics22@gmail.com\nSubject: ${subject}\n\n${emailBody}`;
            navigator.clipboard.writeText(fullEmail).then(() => {
                alert('Complete email content copied to clipboard!');
            });
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(contentStyle);
            }
        });
    }

    showEmailSentMessage(autoUploaded = false) {
        const message = document.createElement('div');
        message.className = 'email-success-message';
        
        if (autoUploaded) {
            message.innerHTML = `
                <div class="message-content">
                    <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                    <div class="message-text">
                        <strong>Email Ready with Images!</strong>
                        <p>Your email client should open with the order details and all images automatically uploaded to ImgBB.</p>
                        <div class="success-note">
                            <p><strong>✅ All images uploaded successfully!</strong></p>
                            <p>The email contains direct links to your high-quality images.</p>
                        </div>
                    </div>
                    <button class="close-message-btn" onclick="this.parentElement.parentElement.parentElement.click()">Perfect!</button>
                </div>
            `;
        } else {
            message.innerHTML = `
                <div class="message-content">
                    <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <path d="M12 9v4"></path>
                        <path d="m12 17 .01 0"></path>
                    </svg>
                    <div class="message-text">
                        <strong>Email Prepared (Manual Upload)</strong>
                        <p>Automatic upload failed, but your email is ready with manual upload instructions.</p>
                        <div class="upload-instructions">
                            <p><strong>Next Steps:</strong></p>
                            <ol>
                                <li>Upload your images to <a href="https://imgbb.com/" target="_blank">ImgBB.com</a></li>
                                <li>Copy the image links</li>
                                <li>Paste the links in the email before sending</li>
                            </ol>
                        </div>
                    </div>
                    <button class="close-message-btn" onclick="this.parentElement.parentElement.parentElement.click()">Got it!</button>
                </div>
            `;
        }
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            border: 2px solid ${autoUploaded ? '#28a745' : '#ffa500'};
            border-radius: 15px;
            padding: 2rem;
            z-index: 1001;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: popIn 0.3s ease-out;
        `;

        // Add styles for the message content
        const style = document.createElement('style');
        style.textContent = `
            .email-success-message .message-content {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            .email-success-message .success-icon {
                width: 24px;
                height: 24px;
                color: #28a745;
                align-self: center;
            }
            .email-success-message .warning-icon {
                width: 24px;
                height: 24px;
                color: #ffa500;
                align-self: center;
            }
            .email-success-message .message-text {
                width: 100%;
            }
            .email-success-message .message-text strong {
                color: #28a745;
                font-size: 1.1rem;
                display: block;
                margin-bottom: 0.5rem;
                text-align: center;
            }
            .email-success-message .message-text p {
                margin: 0 0 1rem 0;
                color: #333;
                line-height: 1.4;
                text-align: center;
            }
            .email-success-message .success-note {
                background-color: #d4edda;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
                border-left: 3px solid #28a745;
            }
            .email-success-message .success-note p {
                margin: 0.2rem 0;
                color: #155724;
                text-align: left;
                font-size: 0.9rem;
            }
            .email-success-message .upload-instructions {
                background-color: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
                border-left: 3px solid #ffa500;
            }
            .email-success-message .upload-instructions p {
                margin: 0 0 0.5rem 0;
                font-weight: 600;
                color: #ffa500;
                text-align: left;
            }
            .email-success-message .upload-instructions ol {
                margin: 0;
                padding-left: 1.2rem;
                color: #333;
            }
            .email-success-message .upload-instructions li {
                margin-bottom: 0.3rem;
                line-height: 1.4;
            }
            .email-success-message .upload-instructions a {
                color: #ffa500;
                text-decoration: none;
                font-weight: 500;
            }
            .email-success-message .upload-instructions a:hover {
                text-decoration: underline;
            }
            .email-success-message .close-message-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 0.5rem 1.5rem;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 500;
                align-self: center;
                margin-top: 0.5rem;
                transition: background-color 0.3s ease;
            }
            .email-success-message .close-message-btn:hover {
                background-color: #2980b9;
            }
            @keyframes popIn {
                from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Create backdrop
        const backdrop = document.createElement('div');
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

        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            document.body.removeChild(backdrop);
            document.body.removeChild(message);
        });

        // Auto close after 10 seconds
        setTimeout(() => {
            if (backdrop.parentNode && message.parentNode) {
                document.body.removeChild(backdrop);
                document.body.removeChild(message);
            }
        }, 10000);
    }

    showCartClearedMessage() {
        const message = document.createElement('div');
        message.className = 'cart-cleared-message';
        message.innerHTML = `
            <div class="message-content">
                <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                <div class="message-text">
                    <strong>Cart Cleared Successfully!</strong>
                    <p>Your cart has been emptied after sending the email. You can now add new items for your next order.</p>
                </div>
                <button class="close-message-btn" onclick="this.parentElement.parentElement.parentElement.click()">Got it!</button>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            border: 2px solid #28a745;
            border-radius: 15px;
            padding: 2rem;
            z-index: 1001;
            max-width: 450px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: popIn 0.3s ease-out;
        `;

        // Add styles for the cart cleared message
        const style = document.createElement('style');
        style.textContent = `
            .cart-cleared-message .message-content {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            .cart-cleared-message .success-icon {
                width: 24px;
                height: 24px;
                color: #28a745;
                align-self: center;
            }
            .cart-cleared-message .message-text {
                width: 100%;
            }
            .cart-cleared-message .message-text strong {
                color: #28a745;
                font-size: 1.1rem;
                display: block;
                margin-bottom: 0.5rem;
                text-align: center;
            }
            .cart-cleared-message .message-text p {
                margin: 0 0 1rem 0;
                color: #333;
                line-height: 1.4;
                text-align: center;
            }
            .cart-cleared-message .close-message-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 0.5rem 1.5rem;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 500;
                align-self: center;
                margin-top: 0.5rem;
                transition: background-color 0.3s ease;
            }
            .cart-cleared-message .close-message-btn:hover {
                background-color: #2980b9;
            }
        `;
        document.head.appendChild(style);

        // Create backdrop
        const backdrop = document.createElement('div');
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

        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            document.body.removeChild(backdrop);
            document.body.removeChild(message);
        });

        // Auto close after 8 seconds
        setTimeout(() => {
            if (backdrop.parentNode && message.parentNode) {
                document.body.removeChild(backdrop);
                document.body.removeChild(message);
            }
        }, 8000);
    }

    checkForPreview() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('preview') === 'true') {
            this.showOrderPreview(urlParams);
        }
    }

    showOrderPreview(urlParams) {
        try {
            const orderId = urlParams.get('orderId') || 'Unknown';
            const totalItems = urlParams.get('totalItems') || '0';
            const totalArea = urlParams.get('totalArea') || '0';
            const totalCost = urlParams.get('totalCost') || '0';
            const orderDate = urlParams.get('orderDate') || 'Unknown';
            const orderTime = urlParams.get('orderTime') || 'Unknown';
            const hasImages = urlParams.get('hasImages') === 'true';
            
            let items = [];
            let imageLinks = [];
            
            try {
                const itemsParam = urlParams.get('items');
                if (itemsParam) {
                    items = JSON.parse(decodeURIComponent(itemsParam));
                }
            } catch (e) {
                console.error('Error parsing items:', e);
            }
            
            try {
                const imageLinksParam = urlParams.get('imageLinks');
                if (imageLinksParam) {
                    imageLinks = JSON.parse(decodeURIComponent(imageLinksParam));
                }
            } catch (e) {
                console.error('Error parsing image links:', e);
            }

            const previewModal = document.createElement('div');
            previewModal.className = 'order-preview-modal';
            previewModal.innerHTML = `
                <div class="preview-content">
                    <div class="preview-header">
                        <h2>📋 Order Preview - ${orderId}</h2>
                        <button class="close-preview-btn" id="closePreviewBtn">×</button>
                    </div>
                    
                    <div class="preview-body">
                        <div class="order-summary">
                            <h3>Order Summary</h3>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <strong>Order ID:</strong> ${orderId}
                                </div>
                                <div class="summary-item">
                                    <strong>Date:</strong> ${orderDate} at ${orderTime}
                                </div>
                                <div class="summary-item">
                                    <strong>Total Items:</strong> ${totalItems}
                                </div>
                                <div class="summary-item">
                                    <strong>Total Area:</strong> ${totalArea} sq in
                                </div>
                                <div class="summary-item">
                                    <strong>Total Cost:</strong> $${totalCost}
                                </div>
                                <div class="summary-item">
                                    <strong>Images Status:</strong> ${hasImages ? '✅ Uploaded' : '⚠️ Manual Upload Required'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="order-items">
                            <h3>Order Items</h3>
                            <div class="items-list">
                                ${items.map((item, index) => `
                                    <div class="item-card">
                                        <div class="item-header">
                                            <h4>Item ${index + 1}: ${item.name}</h4>
                                        </div>
                                        <div class="item-details">
                                            <div class="item-specs">
                                                <span><strong>Width:</strong> ${item.width.toFixed(2)}"</span>
                                                <span><strong>Height:</strong> ${item.height.toFixed(2)}"</span>
                                                <span><strong>Area:</strong> ${item.area.toFixed(2)} sq in</span>
                                                <span><strong>Quantity:</strong> ${item.quantity}</span>
                                                <span><strong>Unit Cost:</strong> $${item.cost.toFixed(2)}</span>
                                                <span><strong>Line Total:</strong> $${(item.cost * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        ${hasImages && imageLinks.length > 0 ? `
                            <div class="image-links">
                                <h3>Image Links</h3>
                                <div class="links-list">
                                    ${imageLinks.map((img, index) => `
                                        <div class="image-link-item">
                                            <strong>${img.name}:</strong>
                                            <div class="link-buttons">
                                                <a href="${img.url}" target="_blank" class="view-link-btn">View Page</a>
                                                <a href="${img.directUrl}" target="_blank" class="download-link-btn">Direct Download</a>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="manual-upload-notice">
                                <h3>⚠️ Manual Image Upload Required</h3>
                                <p>Images were not automatically uploaded. Customer will need to upload images manually to ImgBB and provide links.</p>
                            </div>
                        `}
                    </div>
                    
                    <div class="preview-footer">
                        <button class="close-preview-btn" id="closePreviewFooterBtn">Close Preview</button>
                    </div>
                </div>
            `;

            previewModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 1004;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            `;

            // Add comprehensive styles for the preview modal
            const style = document.createElement('style');
            style.id = 'previewStyles';
            style.textContent = `
                .preview-content {
                    background-color: white;
                    border-radius: 15px;
                    width: 95%;
                    max-width: 800px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }
                .preview-header {
                    padding: 1.5rem;
                    border-bottom: 2px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: #f8f9fa;
                }
                .preview-header h2 {
                    margin: 0;
                    color: #333;
                    font-size: 1.5rem;
                }
                .close-preview-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.3s ease;
                }
                .close-preview-btn:hover {
                    background: #c82333;
                }
                .preview-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .order-summary {
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    background-color: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid #3498db;
                }
                .order-summary h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.3rem;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .summary-item {
                    padding: 0.5rem;
                    background-color: white;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                }
                .order-items {
                    margin-bottom: 2rem;
                }
                .order-items h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.3rem;
                }
                .items-list {
                    display: grid;
                    gap: 1rem;
                }
                .item-card {
                    border: 2px solid #e9ecef;
                    border-radius: 10px;
                    padding: 1.5rem;
                    transition: border-color 0.3s ease;
                }
                .item-card:hover {
                    border-color: #3498db;
                }
                .item-header h4 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.1rem;
                }
                .item-specs {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 0.75rem;
                }
                .item-specs span {
                    padding: 0.5rem;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }
                .image-links {
                    margin-bottom: 2rem;
                }
                .image-links h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.3rem;
                }
                .links-list {
                    display: grid;
                    gap: 1rem;
                }
                .image-link-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }
                .link-buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                .view-link-btn, .download-link-btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background-color 0.3s ease;
                    font-size: 0.9rem;
                }
                .view-link-btn {
                    background-color: #3498db;
                    color: white;
                }
                .view-link-btn:hover {
                    background-color: #2980b9;
                }
                .download-link-btn {
                    background-color: #28a745;
                    color: white;
                }
                .download-link-btn:hover {
                    background-color: #218838;
                }
                .manual-upload-notice {
                    padding: 1.5rem;
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 10px;
                    border-left: 4px solid #ffa500;
                }
                .manual-upload-notice h3 {
                    margin: 0 0 0.5rem 0;
                    color: #856404;
                }
                .manual-upload-notice p {
                    margin: 0;
                    color: #856404;
                }
                .preview-footer {
                    padding: 1.5rem;
                    border-top: 2px solid #e9ecef;
                    text-align: center;
                    background-color: #f8f9fa;
                }
                @media (max-width: 768px) {
                    .preview-content {
                        width: 98%;
                        margin: 1rem;
                    }
                    .summary-grid {
                        grid-template-columns: 1fr;
                    }
                    .item-specs {
                        grid-template-columns: 1fr;
                    }
                    .image-link-item {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .link-buttons {
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(previewModal);

            // Event listeners
            document.getElementById('closePreviewBtn').addEventListener('click', () => {
                document.body.removeChild(previewModal);
                document.head.removeChild(style);
            });

            document.getElementById('closePreviewFooterBtn').addEventListener('click', () => {
                document.body.removeChild(previewModal);
                document.head.removeChild(style);
            });

            // Close on background click
            previewModal.addEventListener('click', (e) => {
                if (e.target === previewModal) {
                    document.body.removeChild(previewModal);
                    document.head.removeChild(style);
                }
            });

        } catch (error) {
            console.error('Error showing order preview:', error);
            alert('Error displaying order preview. Please check the console for details.');
        }
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Make it globally available
window.cartManager = cartManager;
