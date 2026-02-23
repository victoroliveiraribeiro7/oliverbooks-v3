import { books } from './books.js';

function initSearch() {
    const searchBars = document.querySelectorAll('.search-bar');

    searchBars.forEach(bar => {
        const input = bar.querySelector('input');

        // Garante controle de posicionamento para o dropdown ficar grudado e absoluto
        bar.style.position = 'relative';

        // Cria e insere a galeria/dropdown de busca no DOM
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        bar.appendChild(dropdown);

        // Fecha a busca se clicar fora dela
        document.addEventListener('click', (e) => {
            if (!bar.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Escuta a digitação do cliente
        input.addEventListener('input', (e) => {
            const rawQuery = e.target.value;
            const query = normalizeString(rawQuery);

            // Só pesquisa se tiver ao menos 2 letras
            if (query.length < 2) {
                dropdown.classList.remove('show');
                return;
            }

            // Busca pelo título, autor ou categoria ignorando caracteres especiais e acentos.
            const results = books.filter(book => {
                const titleMatch = normalizeString(book.title).includes(query);
                const authorMatch = normalizeString(book.author).includes(query);
                const categoryMatch = normalizeString(book.category || '').includes(query);
                return titleMatch || authorMatch || categoryMatch;
            });

            renderDropdown(dropdown, results, rawQuery);
            dropdown.classList.add('show');
        });
    });
}

// Remove acentuação para pesquisa à prova de erros (ex: "Biblia" acha "Bíblia")
function normalizeString(str) {
    return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderDropdown(dropdown, results, query) {
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="search-no-results">Nenhuma obra literária encontrada para "' + query + '".</div>';
        return;
    }

    // Limita a exibição aos 5 primeiros para não lotar a tela (Design Editorial Limpo)
    const topResults = results.slice(0, 5);

    const html = topResults.map(book => `
    <a href="/produto/index.html?id=${book.id}" class="search-result-item">
      <img src="${book.images[0]}" alt="${book.title}" class="search-result-img">
      <div class="search-result-info">
        <h4>${book.title}</h4>
        <span>${book.author}</span>
        <strong>${book.price}</strong>
      </div>
    </a>
  `).join('');

    let footerHtml = '';
    if (results.length > 5) {
        footerHtml = `<div class="search-more-results">+ ${results.length - 5} resultados não exibidos... Refine a busca.</div>`;
    }

    dropdown.innerHTML = html + footerHtml;
}

// Inicia os listeners de busca apenas quando a Árvore do DOM terminar de ser desenhada.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}
