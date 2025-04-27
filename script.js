import { initRouter }       from './modules/navigation.js';
import { renderFlashcards } from './modules/flashcards.js';
import { renderGlossary }   from './modules/glossary.js';
import { renderPlanEmbed }  from './modules/planEmbed.js';
import { renderQuizEmbed }  from './modules/quizEmbed.js';

(function() {
  'use strict';

  // Проверяем Telegram API
  if (!window.Telegram?.WebApp) {
    console.error('Telegram WebApp API не загружен');
    document.body.innerHTML = 
      `<div style="text-align:center;padding:30px;font-family:sans-serif;color:red;">
       Ошибка: откройте через бота Telegram.
      </div>`;
    return;
  }

  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  // После готовности рендерим SPA
  initRouter({
    '#flashcards': renderFlashcards,
    '#glossary'  : renderGlossary,
    '#quiz'      : renderQuizEmbed,
    '#plan'      : renderPlanEmbed,
});

  // === Логика оплаты ===
  const emailInput  = document.getElementById('email-input');
  const errorBlock  = document.getElementById('error-message');
  const buyButtons  = document.querySelectorAll('.buy-button');
  const tariffCards = document.querySelectorAll('.tariff-card');
  const INITIATE_PAYMENT_URL = 'https://…';
  const EMAIL_STORAGE_KEY    = 'planbotEmail';
  let activeProductId = null;

  const isValidEmail = v => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v.trim());
  const showError    = msg => {
    errorBlock.textContent = msg;
    errorBlock.style.display = msg ? 'block' : 'none';
  };
  const clearError   = () => showError('');

  // MainButton
  tg.MainButton.setParams({ text: 'Оплатить', is_active: false, is_visible: false });

  function updateUI() {
    const valid = isValidEmail(emailInput.value);
    buyButtons.forEach(b => {
      b.disabled = !valid;
      b.classList.toggle('disabled', !valid);
    });
    tg.MainButton.setParams({ is_active: valid && !!activeProductId });
    if (!valid) setActiveCard(null);
  }

  /* === UI Update Function === */
  function updateUI() {
    const email = emailInput.value;
    const isEmailValid = isValidEmail(email);

    // 1) Обновить состояние кнопок "Выбрать"
    buyButtons.forEach(btn => {
      btn.disabled = !isEmailValid;
      btn.classList.toggle("disabled", !isEmailValid);
    });

    // 2) Обновить состояние MainButton (активность)
    // Видимость управляется через mouseenter/mouseleave
    tg.MainButton.setParams({ is_active: isEmailValid && activeProductId !== null });

    // 3) Если email стал невалидным, убираем выделение карточки и скрываем MainButton
    if (!isEmailValid) {
        setActiveCard(null); // Снимаем выделение со всех карточек
        tg.MainButton.hide();
        activeProductId = null;
    }
  }

  /* === Email Input Handling === */
  emailInput.placeholder = "example@mail.ru";
  emailInput.autocomplete = "email";
  emailInput.addEventListener("focus", clearError); // Очищаем ошибку при фокусе

  // Restore email from localStorage
  const cachedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
  if (cachedEmail && isValidEmail(cachedEmail)) {
    emailInput.value = cachedEmail;
  }

  // Validate on input and save to localStorage
  emailInput.addEventListener("input", () => {
    const email = emailInput.value;
    localStorage.setItem(EMAIL_STORAGE_KEY, email);
    clearError(); // Clear previous errors on new input
    updateUI(); // Обновляем состояние кнопок/MainButton
  });

  // Validate on blur (losing focus)
  emailInput.addEventListener("blur", () => {
    const email = emailInput.value;
    if (email && !isValidEmail(email)) {
      showError("Некорректный e‑mail. Проверьте, пожалуйста, адрес.");
    }
  });

  /* === Tariff Card Interaction === */

  // Функция для установки активной карточки (визуально и для MainButton)
  function setActiveCard(cardElement) {
    tariffCards.forEach(card => card.classList.remove("active")); // Снять класс со всех
    if (cardElement) {
      cardElement.classList.add("active"); // Добавить класс к нужной
      activeProductId = cardElement.querySelector('.buy-button')?.dataset.productId;
      tg.MainButton.setParams({ is_active: isValidEmail(emailInput.value) }); // Активировать MainButton, если email валиден
      tg.MainButton.show(); // Показать MainButton
    } else {
      activeProductId = null;
      tg.MainButton.hide(); // Скрыть MainButton, если нет активной карты
    }
  }

  tariffCards.forEach(card => {
    // MOUSE ENTER: Попытаться сделать карту активной
    card.addEventListener("mouseenter", () => {
      if (isValidEmail(emailInput.value)) {
         setActiveCard(card);
      } else {
         // Если email не валиден, не делаем активной и не показываем MainButton
         setActiveCard(null); // Убираем активность с других карт
         // Можно показать подсказку, что нужен email
         emailInput.focus();
         showError("Сначала введите корректный e-mail.");
      }
    });

    // MOUSE LEAVE: Убрать активность с этой карты
    card.addEventListener("mouseleave", () => {
       // Скрываем кнопку и убираем активность только если мышь ушла *с текущей активной* карты
       if(card.classList.contains('active')) {
           setActiveCard(null);
       }
    });

     // CLICK on card: Имитируем клик по кнопке внутри (если email валиден)
     card.addEventListener('click', (e) => {
        // Исключаем клик по самой кнопке, чтобы не было двойного срабатывания
        if (e.target.classList.contains('buy-button')) return;

        if (isValidEmail(emailInput.value)) {
            const button = card.querySelector('.buy-button');
            if (button && !button.disabled) {
                 // Устанавливаем эту карту активной перед симуляцией клика
                 setActiveCard(card);
                 // Неявно вызываем handleClick через MainButton.onClick -> button.click()
                 // или можно напрямую: handleClick({ currentTarget: button });
                 // Но лучше через MainButton для консистентности
            }
        } else {
            emailInput.focus();
            showError("Сначала введите корректный e-mail.");
        }
     });
  });


  /* === Telegram Popup Confirmation === */
  function confirmPurchase(productTitle) {
    // Пытаемся получить более понятное название из карточки
    const card = document.querySelector(`.buy-button[data-product-id="${activeProductId}"]`)?.closest('.tariff-card');
    const title = card?.querySelector('.tariff-title')?.textContent || productTitle; // Используем найденное или ID
    const price = card?.querySelector('.tariff-price')?.textContent || '';

    return new Promise(resolve => {
      tg.showPopup({
        title: "Подтверждение оплаты",
        message: `Вы уверены, что хотите купить «${title}» за ${price}? Чек будет отправлен на ${emailInput.value}.`,
        buttons: [
          { id: "pay", type: "default", text: "Оплатить" },
          { id: "cancel", type: "destructive", text: "Отмена" },
        ]
      }, buttonId => resolve(buttonId === "pay"));
    });
  }

  /* === Loading State Handler === */
  function setLoading(isLoading = true) {
    tg.MainButton.setParams({ is_active: !isLoading }); // Деактивируем во время загрузки
    if (isLoading) {
      tg.MainButton.showProgress(false); // Показываем крутилку (false = indeterminate)
      tg.MainButton.setText("Обработка...");
    } else {
      tg.MainButton.hideProgress();
      tg.MainButton.setText("Оплатить");
      // Активность кнопки восстановится в updateUI или setActiveCard
    }
    // Блокируем/разблокируем кнопки на карточках тоже
    buyButtons.forEach(btn => { btn.disabled = isLoading || !isValidEmail(emailInput.value); });
  }

  /* === Payment Initiation (Button Click Handler) === */
  async function initiatePayment(productId) {
    clearError();
    const email = emailInput.value.trim();

    if (!productId) {
      showError("Не удалось определить выбранный продукт.");
      return;
    }
    if (!isValidEmail(email)) {
      emailInput.focus();
      showError("Введите корректный e‑mail для получения чека.");
      return;
    }

    localStorage.setItem(EMAIL_STORAGE_KEY, email); // Сохраняем email перед оплатой

    // Запрашиваем подтверждение у пользователя
    if (!(await confirmPurchase(productId))) {
      console.log("Пользователь отменил оплату.");
      return; // Пользователь нажал "Отмена"
    }

    // --- Начинаем процесс оплаты ---
    setLoading(true);

    try {
      const requestBody = {
        productId: productId,
        initData: tg.initData || "", // Отправляем initData для верификации на бэкенде
        email: email,
      };

      const response = await fetch(INITIATE_PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data?.success || !data?.paymentUrl) {
        // Используем ошибку от сервера, если есть, иначе общую
        throw new Error(data?.error || `Сервер вернул ошибку (статус ${response.status}).`);
      }

      // Показываем короткое сообщение перед редиректом
      tg.showPopup({ message: "✅ Отлично! Переходим к оплате..." });

      // Задержка перед редиректом, чтобы пользователь увидел сообщение
      setTimeout(() => {
         tg.openLink(data.paymentUrl); // Используем метод Telegram для внешних ссылок
         // window.location.href = data.paymentUrl; // Старый вариант, openLink предпочтительнее
      }, 500); // 0.5 секунды

      // После редиректа setLoading(false) не нужен, т.к. страница перезагрузится

    } catch (err) {
      console.error("Ошибка инициации платежа:", err);
      showError(`Не удалось начать оплату: ${err.message}. Попробуйте еще раз.`);
      setLoading(false); // Снимаем индикатор загрузки при ошибке
      // Не удаляем email из localStorage, чтобы пользователь мог легко повторить
    }
  }

   /* === MainButton Click Action === */
   tg.MainButton.onClick(() => {
       console.log("MainButton clicked, active product:", activeProductId);
       if (activeProductId && tg.MainButton.isActive) {
           initiatePayment(activeProductId);
       } else {
           console.warn("MainButton click ignored: no active product or button inactive.");
           if (!isValidEmail(emailInput.value)) {
               emailInput.focus();
               showError("Введите корректный e-mail.");
           }
       }
   });

   /* === Initial Setup === */

   // Проверка запуска вне Telegram (по наличию initData)
   if (!tg.initData || tg.initData.length === 0) {
       showError("❗️ Пожалуйста, откройте это окно через Telegram‑бота.");
       // Блокируем все взаимодействие
       emailInput.disabled = true;
       buyButtons.forEach(btn => { btn.disabled = true; });
       tariffCards.forEach(card => card.style.pointerEvents = 'none'); // Запрещаем события мыши
       tg.MainButton.hide(); // Скрываем кнопку Telegram
   } else {
       // Если в Telegram, делаем первоначальную настройку UI
       updateUI();
       emailInput.focus(); // Фокус на поле email при загрузке
       console.log("✅ WebApp initialized inside Telegram.");
   }

})(); // End of IIFE