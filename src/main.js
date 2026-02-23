import './style.css'
import { books } from './books.js'
import './cart-ui.js'
import './search-ui.js'
import './mobile-menu.js'
import './quick-add.js'

document.querySelector('#app').innerHTML = `
  <section class="hero-slider">
    <div class="slider-container" id="main-slider">
      <!-- Slide 1 -->
      <div class="slide active">
        <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1920');"></div>
        <div class="slide-content container">
          <span class="hero-label">Novas Edições</span>
          <h1>Obras que Transformam</h1>
          <p>Explore as edições especiais com tradução NVI. O conforto de leitura que você merece.</p>
          <a href="/biblias/" class="btn-primary">Ver Bíblias</a>
        </div>
      </div>
      <!-- Slide 2 -->
      <div class="slide">
        <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=1920');"></div>
        <div class="slide-content container">
          <span class="hero-label">Curadoria Especial</span>
          <h1>Alimento para Alma</h1>
          <p>Descubra uma curadoria exclusiva de obras cristãs clássicas e contemporâneas.</p>
          <a href="/livros/" class="btn-primary">Explorar Acervo</a>
        </div>
      </div>
      <!-- Slide 3 -->
      <div class="slide">
        <div class="slide-bg" style="background-image: url('https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1920');"></div>
        <div class="slide-content container">
          <span class="hero-label">Lançamentos 2026</span>
          <h1>Acompanhe as Novidades</h1>
          <p>As últimas adições ao nosso catálogo, trazendo sabedoria constante para sua jornada.</p>
          <a href="/novidades/" class="btn-primary">Ver Novidades</a>
        </div>
      </div>
    </div>
    
    <!-- Slider Controls -->
    <button class="slider-btn prev-btn" id="sliderPrev">❮</button>
    <button class="slider-btn next-btn" id="sliderNext">❯</button>
    
    <!-- Slider Indicators -->
    <div class="slider-indicators" id="sliderIndicators">
      <span class="dot active" data-slide="0"></span>
      <span class="dot" data-slide="1"></span>
      <span class="dot" data-slide="2"></span>
    </div>
  </section>

  <section id="featured" class="section container">
    <div class="section-header">
      <h2>Obras em Destaque</h2>
      <p>Navegue pelo nosso catálogo oficial.</p>
    </div>
    <div class="book-grid">
      ${books.slice(0, 10).map(book => `
        <div class="book-card">
          <a href="/produto/index.html?id=${book.id}" class="book-link">
            <div class="book-img">
              <img src="${book.images[0]}" alt="${book.title}">
            </div>
            <div class="book-info">
              <span class="book-author">${book.author}</span>
              <h3>${book.title}</h3>
              <div class="book-price-row">
                <span class="book-price">${book.price}</span>
                <button class="quick-add-btn" data-id="${book.id}" title="Adicionar à Sacola">+</button>
              </div>
            </div>
          </a>
        </div>
      `).join('')}
    </div>
  </section>

  <section class="newsletter container">
    <div class="newsletter-box">
      <h2>Junte-se ao Círculo Literário</h2>
      <p>Assine nossa newsletter e receba recomendações personalizadas.</p>
      <form id="newsletter-form">
        <input type="email" placeholder="Seu melhor e-mail" required>
        <button type="submit" class="btn-primary" style="color: white;">Inscrever-se</button>
      </form>
    </div>
  </section>
`

// --- SLIDER LOGIC ---
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.getElementById('sliderPrev');
const nextBtn = document.getElementById('sliderNext');
let currentSlide = 0;
let slideInterval;

function initSlider() {
  if (slides.length === 0) return;

  // Show first slide
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');

  // Start automatic rotation
  startSlideInterval();
}

function startSlideInterval() {
  slideInterval = setInterval(nextSlide, 5000); // 5 seconds per slide
}

function resetSlideInterval() {
  clearInterval(slideInterval);
  startSlideInterval();
}

function goToSlide(index) {
  // Remove classes from current
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');

  currentSlide = index;

  // Add classes to new
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function nextSlide() {
  const newIndex = (currentSlide + 1) % slides.length;
  goToSlide(newIndex);
  resetSlideInterval();
}

function prevSlide() {
  const newIndex = (currentSlide - 1 + slides.length) % slides.length;
  goToSlide(newIndex);
  resetSlideInterval();
}

// Event listeners if elements exist
if (nextBtn && prevBtn) {
  nextBtn.addEventListener('click', nextSlide);
  prevBtn.addEventListener('click', prevSlide);
}

dots.forEach(dot => {
  dot.addEventListener('click', function () {
    const index = parseInt(this.getAttribute('data-slide'));
    goToSlide(index);
    resetSlideInterval();
  });
});

window.addEventListener('DOMContentLoaded', initSlider);

// Lógica de rolagem da Navbar
const nav = document.querySelector('#navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Placeholder de envio de formulário
document.querySelector('#newsletter-form').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Bem-vindo à Oliver Books! Em breve você receberá nossas novidades.');
});




