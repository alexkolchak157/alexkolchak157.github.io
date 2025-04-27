// modules/glossary.js
import { loadProgress, saveProgress } from './storage.js';

let glossary = [];
let favorites = {};

export async function renderGlossary(container) {
  // Clear container and render title
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Словарь терминов';
  title.className = 'glossary-title';
  container.appendChild(title);

  // Load glossary data if not already
  if (!glossary.length) {
    try {
      const response = await fetch('data/glossary.json');
      glossary = await response.json();
    } catch (err) {
      container.appendChild(document.createTextNode('Ошибка загрузки словаря.'));
      console.error(err);
      return;
    }
  }

  // Load favorites from storage
  favorites = loadProgress('glossaryFavorites') || {};

  // Search input wrapper
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'search-wrapper';
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Поиск термина...';
  input.className = 'search-input';
  searchWrapper.appendChild(input);
  container.appendChild(searchWrapper);

  // Glossary grid container
  const grid = document.createElement('div');
  grid.className = 'glossary-grid';
  container.appendChild(grid);

  // Function to render list with optional filter
  function renderList(filter = '') {
    grid.innerHTML = '';
    const filtered = glossary.filter(item =>
      item.term.toLowerCase().includes(filter.toLowerCase()) ||
      item.definition.toLowerCase().includes(filter.toLowerCase())
    );
    if (!filtered.length) {
      const none = document.createElement('p');
      none.textContent = 'Ничего не найдено.';
      none.className = 'no-results';
      grid.appendChild(none);
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('article');
      card.className = 'term-card';

      const header = document.createElement('div');
      header.className = 'term-header';

      const termEl = document.createElement('h3');
      termEl.className = 'term-title';
      termEl.textContent = item.term;

      const favBtn = document.createElement('button');
      favBtn.className = 'fav-btn';
      favBtn.textContent = favorites[item.term] ? '★' : '☆';
      favBtn.addEventListener('click', () => {
        favorites[item.term] = !favorites[item.term];
        saveProgress('glossaryFavorites', favorites);
        favBtn.textContent = favorites[item.term] ? '★' : '☆';
      });

      header.append(termEl, favBtn);
      card.appendChild(header);

      const defEl = document.createElement('p');
      defEl.className = 'term-definition';
      defEl.textContent = item.definition;
      card.appendChild(defEl);

      grid.appendChild(card);
    });
  }

  // Event listeners
  input.addEventListener('input', e => renderList(e.target.value));

  // Initial render
  renderList();
}
