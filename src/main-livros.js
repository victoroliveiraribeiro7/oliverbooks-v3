import './style.css'
import { books } from './books.js'

const livrosCategory = books.filter(book => book.category === 'Livro');

document.querySelector('#app').innerHTML = `
  <section class="section container fade-in" style="padding-top: 180px; min-height: 80vh;">
    <div class="section-header">
      <h2>Catálogo de Livros</h2>
      <p>Explore nossa coleção cuidadosamente selecionada de livros.</p>
    </div>
    <div class="book-grid">
      ${livrosCategory.map(book => `
        <div class="book-card">
          <a href="/produto/index.html?id=${book.id}" class="book-link">
            <div class="book-img">
              <img src="${book.images[0]}" alt="${book.title}">
            </div>
            <div class="book-info">
              <span class="book-author">${book.author}</span>
              <h3>${book.title}</h3>
              <span class="book-price">${book.price}</span>
            </div>
          </a>
        </div>
      `).join('')}
    </div>
  </section>
`
