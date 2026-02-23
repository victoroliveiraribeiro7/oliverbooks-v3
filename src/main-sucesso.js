import { clearCart } from './cart.js'

// App init upon DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // 1. O cliente fez uma compra bem-sucedida. Esvaziamos a sacola global dele.
    clearCart();

    // 2. Extraímos a Session/ID de Transação da URL, se a InfinitePay mandar.
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction_nsu') || urlParams.get('id') || `TRX-${Math.floor(Math.random() * 100000000)}`;

    // 3. Exibimos a ID fictícia ou real como comprovante numérico rápido do ticket
    document.getElementById('transaction-id').textContent = transactionId;
});
