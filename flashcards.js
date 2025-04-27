// modules/flashcards.js

import { loadProgress, saveProgress } from './storage.js';

let cards = [];
let currentIndex = 0;
let isFlipped = false;

export async function renderFlashcards(container) {
  container.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = 'Flashcards: Термины и определения';
  container.appendChild(title);

  // Load data
  if (!cards.length) {
    try {
      const response = await fetch('data/cards.json');
      cards = await response.json();
    } catch (err) {
      container.appendChild(document.createTextNode('Ошибка загрузки карточек.')); 
      console.error(err);
      return;
    }
  }

  // Load progress and find next card
  const progress = loadProgress();
  currentIndex = cards.findIndex(c => !progress[c.id]);
  if (currentIndex === -1) currentIndex = 0; // все изучены

  // Create card element
  const cardEl = document.createElement('div');
  cardEl.className = 'flashcard';
  cardEl.textContent = cards[currentIndex].term;
  cardEl.style.cursor = 'pointer';
  cardEl.addEventListener('click', () => {
    isFlipped = !isFlipped;
    cardEl.textContent = isFlipped ? cards[currentIndex].definition : cards[currentIndex].term;
  });
  container.appendChild(cardEl);

  // Controls
  const controls = document.createElement('div');
  controls.className = 'flashcard-controls';

  const knownBtn = document.createElement('button');
  knownBtn.textContent = 'Изучено';
  knownBtn.addEventListener('click', () => handleStatus(true));

  const laterBtn = document.createElement('button');
  laterBtn.textContent = 'Повторить позже';
  laterBtn.addEventListener('click', () => handleStatus(false));

  controls.append(knownBtn, laterBtn);
  container.appendChild(controls);

  // Helper: update UI for next card
  function handleStatus(markKnown) {
    progress[cards[currentIndex].id] = markKnown;
    saveProgress(progress);
    isFlipped = false;
    // Next card
    currentIndex = (currentIndex + 1) % cards.length;
    cardEl.textContent = cards[currentIndex].term;
  }
}
