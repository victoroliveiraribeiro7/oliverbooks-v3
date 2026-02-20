import './style.css'
import { books } from './books.js'

const bibliasCategory = books.filter(book => book.category === 'Bíblia');

document.querySelector('#app').innerHTML = `
  <section class="section container fade-in" style="padding-top: 180px; min-height: 80vh;">
    <div class="section-header">
      <h2>Catálogo de Bíblias</h2>
      <p>Conheça nossa variedade de Bíblias sagradas, de estudo e decorativas.</p>
    </div>
    <div class="book-grid">
      ${bibliasCategory.map(book => `
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
