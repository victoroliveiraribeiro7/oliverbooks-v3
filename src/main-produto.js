import './style.css'
import { books } from './books.js'

// Simple client-side routing based on URL search params
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

const book = books.find(b => b.id === productId);

if (!book) {
    document.querySelector('#app').innerHTML = `
        <div class="container not-found">
            <h2>Produto não encontrado</h2>
            <p>Não conseguimos localizar o livro solicitado.</p>
            <a href="/" class="btn-primary">Voltar para o Início</a>
        </div>
    `;
} else {
    // Render product details
    const mainImage = book.images[0];
    const thumbnailsHtml = book.images.map(img => `
        <img src="${img}" alt="Miniatura ${book.title}" class="thumbnail" onclick="changeMainImage('${img}')">
    `).join('');

    const productHtml = `
        <section class="product-page container fade-in" style="padding-top: 200px; padding-bottom: 100px;">
            <div class="product-layout">
                <div class="product-gallery">
                    <div class="main-image-container">
                        <img id="main-product-image" src="${mainImage}" alt="${book.title}">
                    </div>
                    ${book.images.length > 1 ? `
                        <div class="thumbnail-list">
                            ${thumbnailsHtml}
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-details">
                    <span class="product-author">${book.author}</span>
                    <h1 class="product-title">${book.title}</h1>
                    <div class="product-price">${book.price}</div>
                    
                    <div class="product-actions">
                        <button class="btn-primary buy-button">Adquirir Já</button>
                    </div>

                    <div class="product-description">
                        <h3>Síntese do Livro</h3>
                        <p>${book.description || 'Descrição não disponível para este produto.'}</p>
                    </div>
                </div>
            </div>
        </section>
    `;

    document.querySelector('#app').innerHTML = productHtml;

    // Attach function to window so the onclick handler works
    window.changeMainImage = (url) => {
        document.getElementById('main-product-image').src = url;
    };
}
