// src/cart.js
// Manager do Carrinho de Compras usando LocalStorage

const CART_KEY = 'oliver_books_cart';

export function getCart() {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

export function addToCart(book) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === book.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Transformar o preço string "R$ 59,90" em float para cálculo fácil
        const numericPrice = parseFloat(book.price.replace('R$ ', '').replace(',', '.'));

        cart.push({
            id: book.id,
            title: book.title,
            priceStr: book.price,
            priceNum: numericPrice,
            image: book.images ? book.images[0] : '',
            quantity: 1
        });
    }

    saveCart(cart);
}

export function removeFromCart(bookId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== bookId);
    saveCart(cart);
}

export function updateQuantity(bookId, quantity) {
    const cart = getCart();
    const item = cart.find(i => i.id === bookId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(bookId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }
}

export function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.priceNum * item.quantity), 0);
}

// Para usar na InfinitePay, o valor precisa ser em centavos (integer)
export function getCartTotalCents() {
    const total = getCartTotal();
    return Math.round(total * 100);
}

// Atualiza alguma bolinha ou contador de itens no header, se existir
export function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Vamos despachar um evento para que qualquer botão de carrinho no site se atualize
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { totalItems } }));
}

export function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}
