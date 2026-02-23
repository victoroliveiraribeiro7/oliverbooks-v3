import { getCart, removeFromCart, getCartTotal, updateQuantity, updateCartBadge } from './cart.js';

// Cria o HTML do carrinho na DOM
function injectCartUI() {
    if (document.getElementById('cart-drawer')) return;

    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.id = 'cart-overlay';

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.id = 'cart-drawer';

    drawer.innerHTML = `
        <div class="cart-drawer-header">
            <h2>Sua Sacola</h2>
            <button class="cart-close-btn" id="cart-close-btn">&times;</button>
        </div>
        <div class="cart-drawer-items" id="cart-drawer-items">
            <!-- Items inseridos via JS -->
        </div>
        <div class="cart-drawer-footer">
            <div class="cart-drawer-total">
                <span>Total</span>
                <span id="cart-drawer-total-price">R$ 0,00</span>
            </div>
            <a href="/checkout/" class="btn-primary cart-drawer-checkout" style="display: block; text-align: center; border-radius: 0;">Finalizar Compra</a>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // Event Listeners base
    document.getElementById('cart-close-btn').addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    // Bind botão de abrir carrinho do Header (se existir)
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    });

    renderCartDrawer();
}

export function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    renderCartDrawer();
}

export function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
}

function renderCartDrawer() {
    const list = document.getElementById('cart-drawer-items');
    const totalPriceEl = document.getElementById('cart-drawer-total-price');
    const checkoutBtn = document.querySelector('.cart-drawer-checkout');

    if (!list) return;

    const cart = getCart();

    if (cart.length === 0) {
        list.innerHTML = '<p class="cart-empty-msg">Nenhum livro selecionado.</p>';
        totalPriceEl.innerText = 'R$ 0,00';
        checkoutBtn.style.pointerEvents = 'none';
        checkoutBtn.style.opacity = '0.5';
        return;
    }

    checkoutBtn.style.pointerEvents = 'auto';
    checkoutBtn.style.opacity = '1';

    let html = '';
    cart.forEach(item => {
        html += `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <span class="cart-item-price">R$ ${(item.priceNum * item.quantity).toFixed(2).replace('.', ',')}</span>
                    <div class="cart-item-actions">
                        <span class="cart-item-qtd">Qtd: ${item.quantity}</span>
                        <button class="cart-item-remove" data-id="${item.id}">Remover</button>
                    </div>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
    totalPriceEl.innerText = 'R$ ' + getCartTotal().toFixed(2).replace('.', ',');

    // Adiciona listener nos botões de remover
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            removeFromCart(id);
        });
    });
}

// Inicia a renderização assim que o DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCartUI);
} else {
    injectCartUI();
}

// Escuta os disparos de alteração para atualizar o Drawer em realtime
window.addEventListener('cartUpdated', () => {
    // Atualiza badges em todas as páginas
    const cartIcons = document.querySelectorAll('.cart-count');
    const totalItems = getCart().reduce((acc, item) => acc + item.quantity, 0);
    cartIcons.forEach(badge => badge.innerText = totalItems);

    renderCartDrawer();
});

// Escuderia global para forçar abertura do modal
window.addEventListener('openCart', openCart);
