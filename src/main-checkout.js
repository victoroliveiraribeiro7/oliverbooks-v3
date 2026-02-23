import './style.css'
import { getCart, removeFromCart, updateQuantity, getCartTotal, getCartTotalCents, clearCart } from './cart.js'

function renderCheckout() {
    const summaryContainer = document.getElementById('cart-summary');
    const btnContainer = document.getElementById('infinitepay-btn-container');
    const cart = getCart();

    if (cart.length === 0) {
        summaryContainer.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio. <br><br> <a href="/">Continuar navegando</a></div>';
        btnContainer.innerHTML = '';
        return;
    }

    // Formatando Resumo: Minimalista e limpo
    let html = '';
    cart.forEach(item => {
        html += `
            <div class="summary-item" style="border-bottom: 1px dotted #ccc; padding-bottom: 0.5rem;">
                <span>${item.quantity}x ${item.title}</span>
                <span>R$ ${(item.priceNum * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    });

    const total = getCartTotal();
    html += `
        <div class="summary-total" style="padding-top: 1rem;">
            <span>Total</span>
            <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
        </div>
    `;

    summaryContainer.innerHTML = html;

    // Gerando Script do InfinitePay Checkout Embed
    // A documentação pede para injetar esse script no local desejado
    const totalCents = getCartTotalCents();
    // Preparando os Itens do Carrinho para o formato que a InfinitePay entende
    const itemsJson = JSON.stringify(cart.map(i => ({
        "id": i.id,
        "description": i.title,
        "amount": Math.round(i.priceNum * 100),
        "quantity": i.quantity
    })));

    // NOTA: Como você não nos passou a SUA TAG DA INFINITEPAY no prompt, usaremos um placeholder.
    // Você vai precisar substituir "sua-tag-aqui" pela tag gerada no site deles futuramente!
    btnContainer.innerHTML = ''; // Clear old buttons
    const script = document.createElement('script');
    script.src = "https://js.infinitepay.io/checkout?tag=victoroliver77";

    // Configura os metadados exigidos pela InfinitePay no DATA do Script
    script.dataset.metadata = encodeURIComponent(JSON.stringify({
        "metadata": {
            "origin": "site_oliverbooks",
            "cart": itemsJson
        }
    }));
    // O valor na InfinitePay é sempre passado como data attr ou dentro das métricas. 
    // Como a documentação é um snnipet de copypaste do Dashboard deles que precisa de "tag" e "amount", a implementação Embed JS básica deles é:
    script.dataset.amount = totalCents;
    script.dataset.type = "payment";

    btnContainer.appendChild(script);
}

document.addEventListener('DOMContentLoaded', renderCheckout);

// Evento disparado caso o carrinho seja alterado na mesma janela
window.addEventListener('cartUpdated', renderCheckout);
