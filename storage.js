// modules/storage.js

const STORAGE_KEY = 'flashcardsProgress';

/**
 * Загружает прогресс карточек из localStorage.
 * @returns {Object} Прогресс в формате { [cardId]: boolean }
 */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Ошибка загрузки прогресса:', e);
    return {};
  }
}

/**
 * Сохраняет прогресс карточек в localStorage.
 * @param {Object} progress Объект прогресса { [cardId]: boolean }
 */
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Ошибка сохранения прогресса:', e);
  }
}
