import './style.css'
import { getCart, getCartTotal, getCartTotalCents, clearCart } from './cart.js'

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

    // Gerando Botão de Checkout via API Link Generation
    btnContainer.innerHTML = `
        <button id="pay-button" class="btn-primary" style="width: 100%; border-radius: 0; padding: 1.5rem; font-size: 1.2rem;">
            Ir para Pagamento
        </button>
        <p id="pay-error" style="color: red; text-align: center; margin-top: 1rem; display: none;"></p>
    `;

    document.getElementById('pay-button').addEventListener('click', async (e) => {
        const btn = e.target;
        const errDisplay = document.getElementById('pay-error');
        btn.innerText = 'Processando...';
        btn.disabled = true;
        errDisplay.style.display = 'none';

        // Prepara os Itens do Carrinho para a API
        const items = cart.map(i => ({
            "description": i.title,
            "price": Math.round(i.priceNum * 100), // Preço unitário em centavos
            "quantity": i.quantity
        }));

        const payload = {
            "handle": "victoroliver77",
            "items": items,
            "order_nsu": "ORDER-" + new Date().getTime(),
            "redirect_url": window.location.origin + "/sucesso"
            // "webhook_url": window.location.origin + "/api/webhook" // Configuração futura para VPS
        };

        try {
            // Em dev local, lidamos com CORS usando o vite.config.js proxy.
            // Em produção (VPS Hostinger/cPanel), lidamos com CORS usando um proxy.php transparente que criamos em `public/api/checkout.php`.
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const fetchUrl = isLocal
                ? '/api/infinitepay/invoices/public/checkout/links'
                : '/api/checkout.php';

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data && data.url) {
                // Sucesso: Redireciona o cliente para o Checkout Seguro da InfinitePay
                window.location.href = data.url;
            } else if (data.message) {
                throw new Error(data.message);
            } else {
                throw new Error("Erro desconhecido ao gerar link.");
            }
        } catch (error) {
            console.error("InfinitePay Error:", error);
            btn.innerText = 'Ir para Pagamento';
            btn.disabled = false;
            errDisplay.innerText = "Falha ao gerar o checkout de pagamento. Tente novamente.";
            errDisplay.style.display = 'block';
        }
    });
}

document.addEventListener('DOMContentLoaded', renderCheckout);

window.addEventListener('cartUpdated', renderCheckout);
