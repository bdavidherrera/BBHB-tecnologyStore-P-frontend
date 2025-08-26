// ==================== CONFIGURACIÓN Y DATOS ====================

import { obtainProductos, crearPedido } from '../Api/consumeApi.js';

const SHIPPING_COST = 15000; // Costo de envío en pesos colombianos

let products = [];
let cart = [];

// ==================== CONFIGURACIÓN DE DESCUENTOS AUTOMÁTICOS ====================

const DISCOUNT_RULES = {
    // Descuentos por cantidad (automático: compra 3 o más del mismo producto, 10% descuento)
    quantity: {
        threshold: 3,
        percentage: 10
    },

    // Descuentos por monto total (automático: se aplica el mayor descuento disponible)
    totalAmount: [
        { threshold: 200000, percentage: 5 },
        { threshold: 500000, percentage: 10 },
        { threshold: 1000000, percentage: 15 }
    ]
};

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function () {
    loadProducts();
    updateCartUI();
    setupEventListeners();
});

// ==================== GESTIÓN DE PRODUCTOS ====================

async function loadProducts() {
    try {
        const productsData = await obtainProductos();

        if (productsData && Array.isArray(productsData)) {
            products = productsData.map(product => ({
                id: product.idProducto,
                name: product.nombreProducto,
                description: product.informacion || "Producto de alta calidad",
                price: parseFloat(product.valor),
                image: product.imagen ? `img/${product.imagen}` : null,
                stock: product.cantidad || 0,
                taxRate: (product.porcentaje_impuesto || 19) / 100,
                // Descuentos específicos del producto (automáticos)
                discount: product.descuento || 0 // Porcentaje de descuento del producto
            }));

            renderProducts();
        }
    } catch (error) {
        console.error("Error al cargar productos:", error);
        showErrorMessage("Error al cargar los productos");
    }
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';

    // Calcular precio con descuento si tiene
    const discountedPrice = product.price * (1 - product.discount / 100);
    const hasDiscount = product.discount > 0;

    productCard.innerHTML = `
        <div class="product-image">
            ${product.image ?
            `<img src="${product.image}" alt="${product.name}" class="product-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="product-emoji-fallback" style="display:none;">📱</div>` :
            `<div class="product-emoji-fallback">📱</div>`
        }
            ${hasDiscount ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
        </div>
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-pricing">
                ${hasDiscount ?
            `<div class="product-price-original">$${formatPrice(product.price)}</div>
                     <div class="product-price-discounted">$${formatPrice(discountedPrice)}</div>` :
            `<div class="product-price">$${formatPrice(product.price)}</div>`
        }
            </div>
            <div class="product-stock">${product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}</div>
            <button class="add-to-cart-btn" 
                    onclick="addToCart(${product.id})" 
                    ${product.stock <= 0 ? 'disabled' : ''}>
                ${product.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
            </button>
        </div>
    `;
    return productCard;
}

// ==================== GESTIÓN DEL CARRITO ====================

function addToCart(productId) {
    const product = findProductById(productId);
    if (!product) return;

    const existingItem = findCartItemById(productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            showAddedToCartAnimation();
        } else {
            showErrorMessage("No hay suficiente stock disponible");
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({ ...product, quantity: 1 });
            showAddedToCartAnimation();
        } else {
            showErrorMessage("Producto sin stock");
            return;
        }
    }

    updateCartUI();
    showSuccessMessage("Producto agregado al carrito");
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = findCartItemById(productId);
    if (!item) return;

    const product = findProductById(productId);
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
        updateCartUI();
    } else {
        showErrorMessage("Cantidad excede el stock disponible");
    }
}

function updateCartUI() {
    updateCartCount();
    updateCartItems();
    updateCartTotals();
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;

    const totalItems = calculateTotalItems();
    cartCount.textContent = totalItems;

    // Animación del contador
    if (totalItems > 0) {
        cartCount.style.display = 'flex';
    } else {
        cartCount.style.display = 'none';
    }
}

function updateCartItems() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p>Tu carrito está vacío</p>
                <p style="font-size: 0.9rem; color: #666;">Agrega algunos productos para comenzar</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => createCartItemHTML(item)).join('');
    }
}

function createCartItemHTML(item) {
    const itemDiscounts = calculateItemDiscounts(item);
    const effectivePrice = item.price - itemDiscounts.productDiscount;
    const itemSubtotal = effectivePrice * item.quantity;
    const quantityDiscount = itemDiscounts.quantityDiscount * item.quantity;
    const finalSubtotal = itemSubtotal - quantityDiscount;
    const itemTax = finalSubtotal * item.taxRate;
    const itemTotal = finalSubtotal + itemTax;

    return `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.image ?
            `<img src="${item.image}" alt="${item.name}" class="cart-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="cart-emoji-fallback" style="display:none;">📱</div>` :
            `<div class="cart-emoji-fallback">📱</div>`
        }
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-pricing">
                    ${item.discount > 0 ?
            `<div class="cart-original-price">$${formatPrice(item.price)} c/u</div>
                         <div class="cart-discounted-price">$${formatPrice(effectivePrice)} c/u</div>` :
            `<div class="cart-item-price">$${formatPrice(item.price)} c/u</div>`
        }
                </div>
                <div class="cart-item-subtotal">Subtotal: $${formatPrice(itemSubtotal)}</div>
                ${quantityDiscount > 0 ?
            `<div class="cart-quantity-discount">✨ Descuento por cantidad (${DISCOUNT_RULES.quantity.percentage}%): -$${formatPrice(quantityDiscount)}</div>` : ''}
                <div class="cart-item-tax">IVA (${(item.taxRate * 100)}%): $${formatPrice(itemTax)}</div>
                <div class="cart-item-total">Total: $${formatPrice(itemTotal)}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)" title="Disminuir cantidad">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)" title="Aumentar cantidad">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                ${item.quantity >= DISCOUNT_RULES.quantity.threshold ?
            `<div class="quantity-discount-info">✨ ¡Descuento del ${DISCOUNT_RULES.quantity.percentage}% aplicado por cantidad!</div>` :
            item.quantity === DISCOUNT_RULES.quantity.threshold - 1 ?
                `<div class="quantity-discount-hint">💡 ¡Agrega 1 más y obtén ${DISCOUNT_RULES.quantity.percentage}% de descuento automático!</div>` : ''}
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})" title="Eliminar producto">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
}

function updateCartTotals() {
    const totals = calculateCartTotals();

    // Actualizar totales en el modal del carrito
    updateElementText('cartSubtotal', formatPrice(totals.subtotal));
    updateElementText('cartDiscounts', formatPrice(totals.discounts));
    updateElementText('cartTax', formatPrice(totals.tax));
    updateElementText('cartTotal', formatPrice(totals.total));

    // Actualizar totales en el checkout
    updateElementText('checkoutSubtotal', formatPrice(totals.subtotal));
    updateElementText('checkoutDiscounts', formatPrice(totals.discounts));
    updateElementText('checkoutTax', formatPrice(totals.tax));
    updateElementText('shippingCost', formatPrice(SHIPPING_COST));
    updateElementText('checkoutTotal', formatPrice(totals.total + SHIPPING_COST));

    // Mostrar/ocultar líneas de descuento
    toggleDiscountLines(totals.discounts > 0);

    // Mostrar información de descuentos automáticos aplicados
    showDiscountInfo(totals);

    // Mostrar sugerencias de descuento
    showDiscountSuggestions(totals);
}

function calculateCartTotals() {
    let subtotal = 0;
    let totalDiscounts = 0;

    // Calcular subtotal y descuentos por ítem
    cart.forEach(item => {
        const itemDiscounts = calculateItemDiscounts(item);
        const effectivePrice = item.price - itemDiscounts.productDiscount;
        const itemSubtotal = effectivePrice * item.quantity;
        const quantityDiscount = itemDiscounts.quantityDiscount * item.quantity;

        subtotal += itemSubtotal;
        totalDiscounts += (itemDiscounts.productDiscount * item.quantity) + quantityDiscount;
    });

    // Aplicar descuento automático por monto total
    const totalAmountDiscount = calculateTotalAmountDiscount(subtotal);
    totalDiscounts += totalAmountDiscount;

    // Calcular subtotal después de descuentos
    const discountedSubtotal = subtotal - totalAmountDiscount;

    // Calcular impuestos sobre el subtotal con descuentos
    const tax = cart.reduce((sum, item) => {
        const itemDiscounts = calculateItemDiscounts(item);
        const effectivePrice = item.price - itemDiscounts.productDiscount;
        const itemSubtotal = effectivePrice * item.quantity;
        const quantityDiscount = itemDiscounts.quantityDiscount * item.quantity;
        const finalItemSubtotal = itemSubtotal - quantityDiscount;

        return sum + (finalItemSubtotal * item.taxRate);
    }, 0);

    // Ajustar impuestos por descuentos adicionales
    const adjustedTax = tax * (discountedSubtotal / subtotal);

    const total = discountedSubtotal + adjustedTax;

    return {
        subtotal: subtotal,
        discounts: totalDiscounts,
        tax: adjustedTax,
        total: total,
        totalAmountDiscount: totalAmountDiscount
    };
}

// ==================== FUNCIONES DE DESCUENTO AUTOMÁTICO ====================

function calculateItemDiscounts(item) {
    // Descuento del producto (automático)
    const productDiscount = item.price * (item.discount / 100);

    // Descuento por cantidad (automático)
    const quantityDiscount = item.quantity >= DISCOUNT_RULES.quantity.threshold ?
        (item.price - productDiscount) * (DISCOUNT_RULES.quantity.percentage / 100) : 0;

    return {
        productDiscount: productDiscount,
        quantityDiscount: quantityDiscount
    };
}

function calculateTotalAmountDiscount(subtotal) {
    // Encontrar el descuento por monto total más alto aplicable (automático)
    const applicableDiscount = DISCOUNT_RULES.totalAmount
        .filter(rule => subtotal >= rule.threshold)
        .sort((a, b) => b.percentage - a.percentage)[0];

    return applicableDiscount ? subtotal * (applicableDiscount.percentage / 100) : 0;
}

function showDiscountInfo(totals) {
    const discountInfo = document.getElementById('discountInfo');
    if (!discountInfo) return;

    const discountsApplied = [];

    // Mostrar descuentos automáticos aplicados
    if (totals.totalAmountDiscount > 0) {
        const applicableDiscount = DISCOUNT_RULES.totalAmount
            .filter(rule => totals.subtotal >= rule.threshold)
            .sort((a, b) => b.percentage - a.percentage)[0];

        discountsApplied.push(`✨ Descuento por compra mayor a $${formatPrice(applicableDiscount.threshold)}: ${applicableDiscount.percentage}%`);
    }

    // Contar descuentos por cantidad aplicados
    const quantityDiscountsCount = cart.filter(item =>
        item.quantity >= DISCOUNT_RULES.quantity.threshold
    ).length;

    if (quantityDiscountsCount > 0) {
        discountsApplied.push(`✨ Descuento por cantidad aplicado en ${quantityDiscountsCount} producto${quantityDiscountsCount > 1 ? 's' : ''}: ${DISCOUNT_RULES.quantity.percentage}%`);
    }

    if (discountsApplied.length > 0) {
        discountInfo.innerHTML = `
            <div class="applied-discounts">
                <h4><i class="fas fa-tags"></i> Descuentos Automáticos Aplicados:</h4>
                ${discountsApplied.map(discount => `<div class="discount-item">${discount}</div>`).join('')}
                <div class="total-savings"><strong>Ahorro total: $${formatPrice(totals.discounts)}</strong></div>
            </div>
        `;
        discountInfo.style.display = 'block';
    } else {
        discountInfo.style.display = 'none';
    }
}

function showDiscountSuggestions(totals) {
    const suggestionsDiv = document.getElementById('discountSuggestions');
    if (!suggestionsDiv) return;

    const suggestions = [];

    // Sugerir descuento por monto total
    const nextTotalDiscount = DISCOUNT_RULES.totalAmount.find(rule => totals.subtotal < rule.threshold);
    if (nextTotalDiscount) {
        const needed = nextTotalDiscount.threshold - totals.subtotal;
        suggestions.push(`💰 ¡Agrega $${formatPrice(needed)} más y obtén ${nextTotalDiscount.percentage}% de descuento automático!`);
    }

    // Sugerir descuentos por cantidad
    cart.forEach(item => {
        if (item.quantity < DISCOUNT_RULES.quantity.threshold) {
            const needed = DISCOUNT_RULES.quantity.threshold - item.quantity;
            if (needed === 1) {
                suggestions.push(`🛍️ ¡Agrega 1 más de "${item.name}" y obtén ${DISCOUNT_RULES.quantity.percentage}% de descuento automático!`);
            } else if (needed <= 3) {
                suggestions.push(`🛍️ ¡Agrega ${needed} más de "${item.name}" y obtén ${DISCOUNT_RULES.quantity.percentage}% de descuento automático!`);
            }
        }
    });

    if (suggestions.length > 0) {
        suggestionsDiv.innerHTML = `
            <div class="discount-suggestions">
                <h4><i class="fas fa-lightbulb"></i> ¡Oportunidades de ahorro automático!</h4>
                ${suggestions.map(suggestion => `<div class="suggestion">${suggestion}</div>`).join('')}
            </div>
        `;
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

function toggleDiscountLines(show) {
    const discountElements = document.querySelectorAll('.discount-line');
    discountElements.forEach(element => {
        element.style.display = show ? 'flex' : 'none';
    });
}

// ==================== GESTIÓN DE MODALES ====================

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) return;

    if (cartModal.style.display === 'flex') {
        cartModal.style.display = 'none';
    } else {
        updateCartUI(); // Actualizar antes de mostrar
        cartModal.style.display = 'flex';
    }
}

function toggleCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (!checkoutModal) return;

    checkoutModal.style.display = checkoutModal.style.display === 'flex' ? 'none' : 'flex';
}

function showCheckoutForm() {
    if (cart.length === 0) {
        showErrorMessage('Tu carrito está vacío');
        return;
    }

    updateCartUI();
    prefillUserData();
    toggleCheckout();
    toggleCart(); // Cerrar el carrito
}

// ==================== CHECKOUT Y PROCESAMIENTO ====================

// Función corregida para prellenar datos del usuario
function prefillUserData() {
    console.log("=== EJECUTANDO PREFILLUSERDATA ===");

    // Obtener datos del sessionStorage
    const userData = {
        nombre: sessionStorage.getItem('nombre'),
        correo: sessionStorage.getItem('correo'),
        telefono: sessionStorage.getItem('telefono'),
        direccion: sessionStorage.getItem('direccion')
    };


    const nameInput = document.getElementById('fullName');
    if (nameInput) {
        if (userData.nombre) {
            nameInput.value = userData.nombre;
        } 
    } 

    // Prellenar campo de email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        if (userData.correo) {
            emailInput.value = userData.correo;
        }
    }
    // Prellenar campo de teléfono
    const phoneInput = document.getElementById('telefono');
    if (phoneInput) {
        if (userData.telefono) {
            phoneInput.value = userData.telefono;
        }
    }

    // Prellenar campo de dirección
    const addressInput = document.getElementById('address');
    if (addressInput) {
        if (userData.direccion) {
            addressInput.value = userData.direccion;
        } 
    } 

}


async function processCheckout(formData) {
    try {
        setSubmitButtonLoading(document.querySelector('#checkoutForm button[type="submit"]'), true);

        const totals = calculateCartTotals();
        const userId = sessionStorage.getItem('idUsuario');

        // Preparar los items del carrito para el detalle del pedido
        const items = cart.map(item => {
            const itemDiscounts = calculateItemDiscounts(item);
            const effectivePrice = item.price - itemDiscounts.productDiscount;
            const quantityDiscount = itemDiscounts.quantityDiscount;
            const itemSubtotal = effectivePrice * item.quantity;
            const finalSubtotal = itemSubtotal - (quantityDiscount * item.quantity);

            return {
                idProducto: item.id,
                cantidad: item.quantity,
                precio_unitario: item.price,
                descuento_unitario: itemDiscounts.productDiscount + quantityDiscount,
                impuesto_unitario: finalSubtotal * item.taxRate / item.quantity,
                total_linea: finalSubtotal + (finalSubtotal * item.taxRate)
            };
        });

        // Crear el pedido
        const orderData = {
            estado: 'pendiente',
            infopersona: `${formData.fullName} - CC: ${sessionStorage.getItem('cedula') || 'N/A'}`,
            correo_electronico: formData.email,
            Direccion: formData.address,
            nombresProductos: generateProductsString(),
            subtotal: totals.subtotal,
            descuentos_totales: totals.discounts,
            impuestos_totales: totals.tax,
            total: totals.total + SHIPPING_COST,
            idUsuario: parseInt(userId),
            items: items,
            datosPago: {
                paymentMethod: formData.paymentMethod,
                cardNumber: formData.cardNumber,
                telefono: formData.telefono || null
            },
            descuentosAutomaticos: true // Indicar que se aplicaron descuentos automáticos
        };


        // Llamar a la API para crear el pedido
        const resultado = await crearPedido(orderData);

        if (resultado && resultado.success) {
            completeCheckout();
            showSuccessMessage(`¡Pedido #${resultado.idPedido} realizado exitosamente!${resultado.idPago ? ` Pago #${resultado.idPago} registrado.` : ''}${totals.discounts > 0 ? ` Ahorraste $${formatPrice(totals.discounts)} con descuentos automáticos.` : ''} Recibirás un correo de confirmación.`);
            loadProducts();
        } else {
            throw new Error(resultado.message || 'Error al procesar el pedido');
        }

    } catch (error) {
        console.error('Error al procesar el checkout:', error);
        showErrorMessage('Error al procesar el pedido. Por favor, intenta nuevamente.');
        setSubmitButtonLoading(document.querySelector('#checkoutForm button[type="submit"]'), false);
    }
}

function generateProductsString() {
    return cart.map(item => `${item.name} (${item.quantity})`).join(', ');
}

function completeCheckout() {
    // Limpiar carrito y cerrar modales
    cart = [];
    updateCartUI();
    toggleCheckout();

    // Resetear formulario
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.reset();
        hideCardDetails();
    }

    setSubmitButtonLoading(document.querySelector('#checkoutForm button[type="submit"]'), false);
}

// ==================== VALIDACIÓN Y FORMATEO ====================

function validateCheckoutForm(formData) {
    const errors = [];

    if (!formData.fullName?.trim()) {
        errors.push('El nombre completo es requerido');
    }

    if (!isValidEmail(formData.email)) {
        errors.push('Ingresa un correo electrónico válido');
    }

    if (!formData.address?.trim()) {
        errors.push('La dirección de envío es requerida');
    }

    if (!formData.paymentMethod) {
        errors.push('Selecciona un método de pago');
    }

    if (formData.paymentMethod === 'creditCard') {
        validateCreditCardFields(formData, errors);
    }

    return errors;
}

function validateCreditCardFields(formData, errors) {
    if (!formData.cardNumber || !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(formData.cardNumber)) {
        errors.push('El número de tarjeta debe tener 16 dígitos');
    }

    if (!formData.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
        errors.push('Fecha de vencimiento inválida (MM/YY)');
    }

    if (!formData.cvv || !/^\d{3,4}$/.test(formData.cvv)) {
        errors.push('CVV debe tener 3 o 4 dígitos');
    }
}

// Funciones de formateo
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    value = value.substring(0, 16);

    const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');

    if (value.length >= 2) {
        let month = value.substring(0, 2);
        let year = value.substring(2, 4);

        if (parseInt(month) > 12) month = '12';
        if (parseInt(month) < 1 && month.length === 2) month = '01';

        input.value = month + (year ? '/' + year : '');
    } else {
        input.value = value;
    }
}

function formatCVV(input) {
    const value = input.value.replace(/[^0-9]/g, '');
    input.value = value.substring(0, 4);
}

function formatName(input) {
    input.value = input.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
}

// ==================== UTILIDADES Y HELPERS ====================

function findProductById(id) {
    return products.find(p => p.id === id);
}

function findCartItemById(id) {
    return cart.find(item => item.id === id);
}

function calculateTotalItems() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function isValidEmail(email) {
    return email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO').format(Math.round(price));
}

function showAddedToCartAnimation() {
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;

    cartIcon.style.transform = 'scale(1.2)';
    cartIcon.style.background = 'rgba(40, 167, 69, 0.3)';

    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
        cartIcon.style.background = 'rgba(255,255,255,0.2)';
    }, 300);
}

function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showSuccessMessage(message) {
    // Crear y mostrar mensaje de éxito
    const alertDiv = document.createElement('div');
    alertDiv.className = 'success-message';
    alertDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        document.body.removeChild(alertDiv);
    }, 4000);
}

function showErrorMessage(message) {
    // Crear y mostrar mensaje de error
    const alertDiv = document.createElement('div');
    alertDiv.className = 'error-message';
    alertDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (document.body.contains(alertDiv)) {
            document.body.removeChild(alertDiv);
        }
    }, 4000);
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    setupModalClickEvents();
    setupKeyboardEvents();
    setupPaymentMethodToggle();
    setupInputFormatting();
    setupFormSubmission();
}

function setupModalClickEvents() {
    document.addEventListener('click', function (e) {
        const cartModal = document.getElementById('cartModal');
        const checkoutModal = document.getElementById('checkoutModal');

        if (e.target === cartModal) toggleCart();
        if (e.target === checkoutModal) toggleCheckout();
    });
}

function setupKeyboardEvents() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const cartModal = document.getElementById('cartModal');
            const checkoutModal = document.getElementById('checkoutModal');

            if (cartModal?.style.display === 'flex') {
                toggleCart();
            } else if (checkoutModal?.style.display === 'flex') {
                toggleCheckout();
            }
        }
    });
}

function setupPaymentMethodToggle() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', function () {
            const cardDetails = document.getElementById('cardDetails');
            if (cardDetails) {
                if (this.value === 'creditCard') {
                    cardDetails.style.display = 'block';
                } else {
                    cardDetails.style.display = 'none';
                    hideCardDetails();
                }
            }
        });
    });
}

function hideCardDetails() {
    const cardDetails = document.getElementById('cardDetails');
    if (cardDetails) {
        cardDetails.style.display = 'none';
    }
}

function setupInputFormatting() {
    const inputs = {
        fullName: formatName,
        cardNumber: formatCardNumber,
        expiryDate: formatExpiryDate,
        cvv: formatCVV
    };

    Object.entries(inputs).forEach(([id, formatter]) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => formatter(input));
        }
    });
}

function setupFormSubmission() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = collectFormData();
        const errors = validateCheckoutForm(formData);

        if (errors.length > 0) {
            showErrorMessage('Por favor corrige los siguientes errores:\n\n• ' + errors.join('\n• '));
            return;
        }

        processCheckout(formData);
    });
}

function collectFormData() {
    return {
        fullName: document.getElementById('fullName')?.value,
        email: document.getElementById('email')?.value,
        telefono: document.getElementById('telefono')?.value,
        address: document.getElementById('address')?.value,
        paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value,
        cardNumber: document.getElementById('cardNumber')?.value,
        expiryDate: document.getElementById('expiryDate')?.value,
        cvv: document.getElementById('cvv')?.value
    };
}

function setSubmitButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || '<i class="fas fa-lock"></i> Confirmar Pedido';
        button.disabled = false;
    }
}



// ==================== SISTEMA DE FILTROS PARA PRODUCTOS ====================

// Variables globales para filtros
let activeFilters = {
    priceRange: { min: 0, max: Infinity },
    category: 'all',
    inStock: false,
    searchQuery: '',
    sortBy: 'name' // name, price-asc, price-desc, stock
};

// Rangos de precios predefinidos (en pesos colombianos)
const PRICE_RANGES = [
    { label: 'Todos los precios', min: 0, max: Infinity },
    { label: 'Menos de $50.000', min: 0, max: 50000 },
    { label: '$50.000 - $100.000', min: 50000, max: 100000 },
    { label: '$100.000 - $200.000', min: 100000, max: 200000 },
    { label: '$200.000 - $500.000', min: 200000, max: 500000 },
    { label: '$500.000 - $1.000.000', min: 500000, max: 1000000 },
    { label: 'Más de $1.000.000', min: 1000000, max: Infinity }
];

// ==================== INICIALIZACIÓN DE FILTROS ====================

function initializeFilters() {
    createFilterUI();
    setupFilterEventListeners();
    updateProductsWithFilters();
}

// ==================== CREACIÓN DE LA INTERFAZ DE FILTROS ====================

function createFilterUI() {
    const productsSection = document.getElementById('products');
    if (!productsSection) return;

    // Crear contenedor de filtros
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'filters-container';
    filtersContainer.id = 'filtersContainer';
    
    filtersContainer.innerHTML = `
        <div class="filters-header">
            <h3><i class="fas fa-filter"></i> Filtros</h3>
            <button class="filters-toggle" id="filtersToggle">
                <i class="fas fa-chevron-down"></i>
            </button>
        </div>
        
        <div class="filters-content" id="filtersContent">
            <!-- Barra de búsqueda -->
            <div class="filter-group">
                <label class="filter-label">
                    <i class="fas fa-search"></i> Buscar productos
                </label>
                <div class="search-wrapper">
                    <input 
                        type="text" 
                        id="searchInput" 
                        placeholder="Buscar por nombre..."
                        class="search-input"
                    >
                    <button class="search-clear" id="searchClear" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Filtro por rango de precio -->
            <div class="filter-group">
                <label class="filter-label">
                    <i class="fas fa-tags"></i> Rango de precio
                </label>
                <div class="price-filter-options">
                    ${PRICE_RANGES.map((range, index) => `
                        <label class="price-option">
                            <input 
                                type="radio" 
                                name="priceRange" 
                                value="${index}"
                                ${index === 0 ? 'checked' : ''}
                            >
                            <span class="price-option-label">${range.label}</span>
                        </label>
                    `).join('')}
                </div>
                
                <!-- Rango personalizado -->
                <div class="custom-price-range">
                    <label class="price-option">
                        <input 
                            type="radio" 
                            name="priceRange" 
                            value="custom"
                        >
                        <span class="price-option-label">Rango personalizado:</span>
                    </label>
                    <div class="custom-inputs">
                        <div class="price-input-group">
                            <span class="currency">$</span>
                            <input 
                                type="number" 
                                id="minPrice" 
                                placeholder="Precio mín"
                                min="0"
                                step="1000"
                                class="price-input"
                            >
                        </div>
                        <span class="price-separator">-</span>
                        <div class="price-input-group">
                            <span class="currency">$</span>
                            <input 
                                type="number" 
                                id="maxPrice" 
                                placeholder="Precio máx"
                                min="0"
                                step="1000"
                                class="price-input"
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filtro por disponibilidad -->
            <div class="filter-group">
                <label class="filter-label">
                    <i class="fas fa-box"></i> Disponibilidad
                </label>
                <label class="checkbox-wrapper">
                    <input type="checkbox" id="inStockOnly">
                    <span class="checkmark"></span>
                    Solo productos en stock
                </label>
            </div>

            <!-- Ordenamiento -->
            <div class="filter-group">
                <label class="filter-label">
                    <i class="fas fa-sort"></i> Ordenar por
                </label>
                <select id="sortBy" class="sort-select">
                    <option value="name">Nombre (A-Z)</option>
                    <option value="name-desc">Nombre (Z-A)</option>
                    <option value="price-asc">Precio (menor a mayor)</option>
                    <option value="price-desc">Precio (mayor a menor)</option>
                    <option value="stock">Stock disponible</option>
                </select>
            </div>

            <!-- Acciones de filtro -->
            <div class="filter-actions">
                <button class="btn-apply-filters" id="applyFilters">
                    <i class="fas fa-check"></i> Aplicar filtros
                </button>
                <button class="btn-clear-filters" id="clearFilters">
                    <i class="fas fa-eraser"></i> Limpiar filtros
                </button>
                
            </div>

            <!-- Contador de resultados -->
            <div class="filter-results" id="filterResults">
                <span id="resultsCount">0</span> productos encontrados
            </div>
        </div>
    `;

    // Insertar antes de la grilla de productos
    const sectionTitle = productsSection.querySelector('.section-title');
    if (sectionTitle) {
        sectionTitle.insertAdjacentElement('afterend', filtersContainer);
    } else {
        productsSection.insertBefore(filtersContainer, productsSection.firstChild);
    }
}

// ==================== EVENT LISTENERS PARA FILTROS ====================

function setupFilterEventListeners() {
    // Toggle de filtros
    const filtersToggle = document.getElementById('filtersToggle');
    if (filtersToggle) {
        filtersToggle.addEventListener('click', toggleFilters);
    }

    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }

    // Limpiar búsqueda
    const searchClear = document.getElementById('searchClear');
    if (searchClear) {
        searchClear.addEventListener('click', clearSearch);
    }

    // Rangos de precio predefinidos
    const priceRadios = document.querySelectorAll('input[name="priceRange"]');
    priceRadios.forEach(radio => {
        radio.addEventListener('change', handlePriceRangeChange);
    });

    // Rango personalizado
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice && maxPrice) {
        minPrice.addEventListener('input', handleCustomPriceRange);
        maxPrice.addEventListener('input', handleCustomPriceRange);
    }

    // Filtro de stock
    const inStockOnly = document.getElementById('inStockOnly');
    if (inStockOnly) {
        inStockOnly.addEventListener('change', handleStockFilter);
    }

    // Ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', handleSortChange);
    }

    // Botones de acción
    const applyFilters = document.getElementById('applyFilters');
    const clearFilters = document.getElementById('clearFilters');
    
    if (applyFilters) {
        applyFilters.addEventListener('click', updateProductsWithFilters);
    }
    
    if (clearFilters) {
        clearFilters.addEventListener('click', resetAllFilters);
    }
}

// ==================== MANEJADORES DE EVENTOS ====================

function toggleFilters() {
    const filtersContent = document.getElementById('filtersContent');
    const filtersToggle = document.getElementById('filtersToggle');
    
    if (!filtersContent || !filtersToggle) return;

    const isCollapsed = filtersContent.style.display === 'none';
    
    filtersContent.style.display = isCollapsed ? 'block' : 'none';
    filtersToggle.innerHTML = isCollapsed 
        ? '<i class="fas fa-chevron-up"></i>' 
        : '<i class="fas fa-chevron-down"></i>';
}

function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (!searchInput) return;

    activeFilters.searchQuery = searchInput.value.trim().toLowerCase();
    
    // Mostrar/ocultar botón de limpiar
    if (searchClear) {
        searchClear.style.display = activeFilters.searchQuery ? 'block' : 'none';
    }
    
    // Aplicar filtros en tiempo real para búsqueda
    updateProductsWithFilters();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
        searchInput.value = '';
        activeFilters.searchQuery = '';
    }
    
    if (searchClear) {
        searchClear.style.display = 'none';
    }
    
    updateProductsWithFilters();
}

function handlePriceRangeChange(e) {
    const value = e.target.value;
    
    if (value === 'custom') {
        // Habilitar inputs personalizados
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        
        if (minPrice && maxPrice) {
            minPrice.disabled = false;
            maxPrice.disabled = false;
            handleCustomPriceRange();
        }
    } else {
        // Usar rango predefinido
        const rangeIndex = parseInt(value);
        const range = PRICE_RANGES[rangeIndex];
        
        activeFilters.priceRange = {
            min: range.min,
            max: range.max
        };
        
        // Deshabilitar inputs personalizados
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        
        if (minPrice && maxPrice) {
            minPrice.disabled = true;
            maxPrice.disabled = true;
            minPrice.value = '';
            maxPrice.value = '';
        }
    }
    
    updateProductsWithFilters();
}

function handleCustomPriceRange() {
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    if (!minPrice || !maxPrice) return;

    const min = parseInt(minPrice.value) || 0;
    const max = parseInt(maxPrice.value) || Infinity;
    
    activeFilters.priceRange = {
        min: Math.max(0, min),
        max: max > min ? max : Infinity
    };
    
    updateProductsWithFilters();
}

function handleStockFilter() {
    const inStockOnly = document.getElementById('inStockOnly');
    if (!inStockOnly) return;

    activeFilters.inStock = inStockOnly.checked;
    updateProductsWithFilters();
}

function handleSortChange() {
    const sortBy = document.getElementById('sortBy');
    if (!sortBy) return;

    activeFilters.sortBy = sortBy.value;
    updateProductsWithFilters();
}

// ==================== APLICACIÓN DE FILTROS ====================

function updateProductsWithFilters() {
    if (!products || !Array.isArray(products)) return;

    // Aplicar filtros
    let filteredProducts = products.filter(product => {
        return applyAllFilters(product);
    });

    // Aplicar ordenamiento
    filteredProducts = sortProducts(filteredProducts);

    // Renderizar productos filtrados
    renderFilteredProducts(filteredProducts);
    
    // Actualizar contador de resultados
    updateResultsCount(filteredProducts.length);

    // Mostrar mensaje si no hay resultados
    if (filteredProducts.length === 0) {
        showNoResultsMessage();
    }
}

function applyAllFilters(product) {
    // Obtener precio efectivo (con descuentos)
    const effectivePrice = product.price * (1 - (product.discount || 0) / 100);
    
    // Filtro por precio
    if (effectivePrice < activeFilters.priceRange.min || 
        effectivePrice > activeFilters.priceRange.max) {
        return false;
    }

    // Filtro por stock
    if (activeFilters.inStock && product.stock <= 0) {
        return false;
    }

    // Filtro por búsqueda
    if (activeFilters.searchQuery) {
        const searchTerm = activeFilters.searchQuery;
        const productName = product.name.toLowerCase();
        const productDescription = (product.description || '').toLowerCase();
        
        if (!productName.includes(searchTerm) && !productDescription.includes(searchTerm)) {
            return false;
        }
    }

    return true;
}

function sortProducts(products) {
    const sortBy = activeFilters.sortBy;
    
    return [...products].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            
            case 'name-desc':
                return b.name.localeCompare(a.name);
            
            case 'price-asc':
                const priceA = a.price * (1 - (a.discount || 0) / 100);
                const priceB = b.price * (1 - (b.discount || 0) / 100);
                return priceA - priceB;
            
            case 'price-desc':
                const priceDescA = a.price * (1 - (a.discount || 0) / 100);
                const priceDescB = b.price * (1 - (b.discount || 0) / 100);
                return priceDescB - priceDescA;
            
            case 'stock':
                return b.stock - a.stock;
            
            default:
                return 0;
        }
    });
}

function renderFilteredProducts(filteredProducts) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '';
        return;
    }

    productsGrid.innerHTML = '';
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function showNoResultsMessage() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = `
        <div class="no-results-message">
            <div class="no-results-icon">
                <i class="fas fa-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
            </div>
            <h3>No se encontraron productos</h3>
            <p>No hay productos que coincidan con los filtros seleccionados.</p>
            <button class="btn-clear-filters" onclick="resetAllFilters()">
                <i class="fas fa-eraser"></i> Limpiar filtros
            </button>
        </div>
    `;
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = count;
    }
}

// ==================== RESET DE FILTROS ====================

function resetAllFilters() {
    // Resetear filtros activos
    activeFilters = {
        priceRange: { min: 0, max: Infinity },
        category: 'all',
        inStock: false,
        searchQuery: '',
        sortBy: 'name'
    };

    // Resetear interfaz
    resetFilterUI();
    
    // Aplicar filtros (mostrar todos los productos)
    updateProductsWithFilters();
    
    showSuccessMessage('Filtros restablecidos');
}

function resetFilterUI() {
    // Limpiar búsqueda
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
        searchInput.value = '';
    }
    if (searchClear) {
        searchClear.style.display = 'none';
    }

    // Resetear rangos de precio
    const priceRadios = document.querySelectorAll('input[name="priceRange"]');
    priceRadios.forEach((radio, index) => {
        radio.checked = index === 0;
    });

    // Limpiar inputs personalizados
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    if (minPrice && maxPrice) {
        minPrice.value = '';
        maxPrice.value = '';
        minPrice.disabled = true;
        maxPrice.disabled = true;
    }

    // Resetear filtro de stock
    const inStockOnly = document.getElementById('inStockOnly');
    if (inStockOnly) {
        inStockOnly.checked = false;
    }

    // Resetear ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.value = 'name';
    }
}

// ==================== FUNCIONES PÚBLICAS ====================

// Función para obtener productos filtrados (útil para otras partes del código)
function getFilteredProducts() {
    if (!products || !Array.isArray(products)) return [];
    
    return products.filter(product => applyAllFilters(product));
}

// Función para aplicar un filtro específico desde código
function setFilter(filterType, value) {
    switch (filterType) {
        case 'price':
            activeFilters.priceRange = value;
            break;
        case 'search':
            activeFilters.searchQuery = value.toLowerCase();
            break;
        case 'stock':
            activeFilters.inStock = value;
            break;
        case 'sort':
            activeFilters.sortBy = value;
            break;
    }
    
    updateProductsWithFilters();
}

// Función para obtener el estado actual de los filtros
function getActiveFilters() {
    return { ...activeFilters };
}

// ==================== INTEGRACIÓN CON EL SISTEMA EXISTENTE ====================

// Modificar la función loadProducts original para incluir filtros
const originalLoadProducts = loadProducts;
loadProducts = async function() {
    await originalLoadProducts();
    
    // Inicializar filtros después de cargar productos
    if (products && products.length > 0) {
        // Verificar si ya existe el contenedor de filtros
        if (!document.getElementById('filtersContainer')) {
            initializeFilters();
        } else {
            updateProductsWithFilters();
        }
    }
};

// Hacer disponibles las funciones globalmente
window.resetAllFilters = resetAllFilters;
window.setFilter = setFilter;
window.getFilteredProducts = getFilteredProducts;
window.getActiveFilters = getActiveFilters;

// ==================== FUNCIONES GLOBALES ====================
// Estas funciones deben estar disponibles globalmente para los onclick en HTML

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.toggleCart = toggleCart;
window.toggleCheckout = toggleCheckout;
window.showCheckoutForm = showCheckoutForm;
window.scrollToProducts = scrollToProducts;