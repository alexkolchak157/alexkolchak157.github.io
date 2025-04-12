// --- Лог при загрузке скрипта ---
console.log('Script loaded. Checking for Telegram WebApp environment...');
if (window.Telegram && window.Telegram.WebApp) {
    console.log('Telegram WebApp object FOUND.');
    // Можно даже проверить initData здесь, но он может быть еще не готов
    // console.log('Initial initData:', window.Telegram.WebApp.initData || 'Not available yet');
} else {
    console.error('Telegram WebApp object NOT FOUND!');
    // Показать ошибку пользователю сразу, если объект ТГ не найден
    const errorDiv = document.getElementById('error-message');
     if (errorDiv) {
        errorDiv.textContent = 'Ошибка: Не удалось загрузить окружение Telegram.';
        errorDiv.style.display = 'block';
    }
}

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Проверяем, что tg действительно объект, прежде чем вызывать методы
if (tg && typeof tg === 'object') {
    tg.ready();
    tg.expand(); // Расширяем на весь экран
    console.log('tg.ready() and tg.expand() called.');
} else {
     console.error('Cannot call tg.ready() or tg.expand() because tg object is invalid.');
     // Возможно, стоит показать ошибку пользователю и здесь
}


// URL вашего бэкенда для инициации платежа
const INITIATE_PAYMENT_URL = 'https://webhook.обществонапальцах.рф/initiate-payment';

// Элемент для вывода ошибок на страницу
const errorDisplayElement = document.getElementById('error-message'); // Убедитесь, что у вас есть <div id="error-message"></div> в HTML

// Функция для показа ошибки на странице
function showClientError(message) {
    if (errorDisplayElement) {
        errorDisplayElement.textContent = message;
        errorDisplayElement.style.display = 'block'; // Показать элемент
    }
    console.error("Client Error:", message);
}

// Функция для очистки сообщения об ошибке
function clearClientError() {
     if (errorDisplayElement) {
        errorDisplayElement.textContent = '';
        errorDisplayElement.style.display = 'none'; // Скрыть элемент
    }
}

// Функция обработки клика по кнопке покупки
async function handlePurchaseClick(event) {
    clearClientError(); // Очищаем предыдущие ошибки
    const button = event.currentTarget;
    const productId = button.dataset.productId;

    console.log('handlePurchaseClick called for productId:', productId);

    // --- Усиленная проверка перед получением initData ---
    if (!tg || typeof tg !== 'object' || !tg.initData) {
        console.error('Telegram WebApp environment or initData not ready/available at click time!');
        console.log('Current tg object:', tg);
        console.log('Current tg.initData:', tg ? tg.initData : 'tg is undefined');
        showClientError('Ошибка: Данные Telegram недоступны для начала оплаты.');
        // Возможно, не стоит блокировать кнопки, если ошибка на этом этапе
        return;
    }
    // --- Конец проверки ---

    if (!productId) {
        console.error('Не найден product ID на кнопке!');
        showClientError('Ошибка: Не найден ID продукта.');
        return;
    }

    // Показываем индикатор загрузки/ожидания
    try {
        tg.MainButton.setText('Обработка...');
        tg.MainButton.showProgress(true);
        tg.MainButton.disable();
    } catch (uiError) {
        console.warn("Error setting MainButton progress:", uiError);
    }
    button.disabled = true;

    try {
        const initData = tg.initData; // Теперь мы более уверены, что tg и tg.initData существуют
        console.log('Raw initData received:', initData);

        // Валидация на всякий случай (хотя основная проверка выше)
        if (!initData) {
            throw new Error('Не удалось получить данные инициализации Telegram (initData) - проверка после доступа');
        }

        console.log('Отправка запроса на бэкенд:', INITIATE_PAYMENT_URL);
        console.log('Данные:', { productId: productId, initData: initData });

        // Отправляем запрос на ваш бэкенд методом POST
        const response = await fetch(INITIATE_PAYMENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                initData: initData
            }),
        });

        console.log('Backend response status:', response.status);

        // Пытаемся расшифровать ответ как JSON
        let responseData;
        const responseText = await response.text();
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.error("Ошибка парсинга JSON ответа от бэкенда:", e);
            console.error("Текст ответа:", responseText);
            throw new Error(`Сервер вернул некорректный ответ (не JSON). Код: ${response.status}`);
        }

        console.log('Ответ от бэкенда (parsed):', responseData);

        // Проверяем ответ от бэкенда
        if (response.ok && responseData.success && responseData.paymentUrl) {
            console.log('Redirecting to payment URL:', responseData.paymentUrl);
            window.location.href = responseData.paymentUrl;
        } else {
            throw new Error(responseData.error || `Ошибка инициации платежа от бэкенда. Код: ${response.status}`);
        }

    } catch (error) {
        console.error('Ошибка при инициации платежа (в блоке catch):', error);
        showClientError(`Не удалось начать оплату: ${error.message}`);

        // Убираем индикатор загрузки и снова включаем кнопки
        try {
             tg.MainButton.hideProgress();
             tg.MainButton.enable();
             tg.MainButton.setText('Оплатить'); // Или исходный текст
        } catch(uiError) {
            console.warn("Error resetting MainButton UI:", uiError);
        }
        button.disabled = false;
    }
}

// Находим все кнопки покупки
const purchaseButtons = document.querySelectorAll('.buy-button'); // Убедитесь, что у кнопок есть класс "buy-button"

// Добавляем обработчик к каждой кнопке
if (purchaseButtons.length > 0) {
     console.log(`Found ${purchaseButtons.length} elements with class 'buy-button'. Attaching listeners.`);
     purchaseButtons.forEach(button => {
        button.addEventListener('click', handlePurchaseClick);
    });
} else {
     console.warn("No elements with class 'buy-button' found. Purchase buttons will not work.");
}


console.log("Telegram Web App script fully loaded and event listeners attached (if buttons found).");

