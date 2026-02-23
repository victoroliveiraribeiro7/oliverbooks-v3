import { books } from './books.js';
import { addToCart } from './cart.js';

document.addEventListener('click', (e) => {
    // Captura o clique no botão "+ Adicionar" usando event delegation
    const btn = e.target.closest('.quick-add-btn');

    if (btn) {
        // Impede que o link do Livro dispare a navegação para a tela de detalhes
        e.preventDefault();
        e.stopPropagation();

        const bookId = btn.getAttribute('data-id');
        const book = books.find(b => b.id === bookId);

        if (book) {
            addToCart(book);
            window.dispatchEvent(new CustomEvent('openCart')); // Abre a gaveta mágica
        }
    }
});
