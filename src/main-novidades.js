import './style.css'
import { books } from './books.js'
import './cart-ui.js'
import './search-ui.js'

const novidadesCategory = books.filter(book => book.isNew === true);

document.querySelector('#app').innerHTML = `
  <section class="section container fade-in" style="padding-top: 180px; min-height: 80vh;">
    <div class="section-header">
      <h2>Novidades</h2>
      <p>Confira os últimos lançamentos e adições ao nosso catálogo.</p>
    </div>
    <div class="book-grid">
      ${novidadesCategory.map(book => `
        <div class="book-card">
          <a href="/produto/index.html?id=${book.id}" class="book-link">
            <div class="book-img">
              <div class="badge-novidade">Novo</div>
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
