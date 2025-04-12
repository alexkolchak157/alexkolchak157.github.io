// --- Лог при загрузке скрипта ---
console.log('Script loaded. Checking for Telegram WebApp environment...');
if (window.Telegram && window.Telegram.WebApp) {
    console.log('Telegram WebApp object FOUND.');
    // Можно даже проверить initData здесь, но он может быть еще не готов
    // console.log('Initial initData:', window.Telegram.WebApp.initData || 'Not available yet');
    // console.log('Initial initDataUnsafe:', window.Telegram.WebApp.initDataUnsafe || 'Not available yet');
} else {
    console.error('Telegram WebApp object NOT FOUND!');
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
}


// URL вашего бэкенда для инициации платежа
const INITIATE_PAYMENT_URL = 'https://webhook.обществонапальцах.рф/initiate-payment';

// Элемент для вывода ошибок на страницу
const errorDisplayElement = document.getElementById('error-message'); // Убедитесь, что у вас есть <div id="error-message"></div> в HTML

// Функция для показа ошибки на странице
function showClientError(message) {
    if (errorDisplayElement) {
        errorDisplayElement.textContent = message;
        errorDisplayElement.style.display = 'block';
    }
    console.error("Client Error:", message);
}

// Функция для очистки сообщения об ошибке
function clearClientError() {
     if (errorDisplayElement) {
        errorDisplayElement.textContent = '';
        errorDisplayElement.style.display = 'none';
    }
}

// Функция обработки клика по кнопке покупки
async function handlePurchaseClick(event) {
    clearClientError();
    const button = event.currentTarget;
    const productId = button.dataset.productId;

    console.log('handlePurchaseClick called for productId:', productId);

    // --- Проверка окружения и данных ПЕРЕД попыткой ---
    console.log('Checking environment at click time...');
    console.log('Current tg object:', tg);
    const currentInitData = tg ? tg.initData : 'tg_is_undefined';
    const currentInitDataUnsafe = tg ? JSON.stringify(tg.initDataUnsafe) : 'tg_is_undefined'; // Логируем небезопасные данные тоже

    console.log('Current tg.initData:', currentInitData || 'null_or_empty');
    console.log('Current tg.initDataUnsafe:', currentInitDataUnsafe || 'null_or_empty');

    // Проверяем именно initData, т.к. он нужен для валидации
    if (!tg || typeof tg !== 'object' || !currentInitData) {
        console.error('Telegram WebApp environment or VALIDATED initData not ready/available at click time!');
        showClientError('Ошибка: Данные Telegram недоступны для начала оплаты (initData missing).');
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
        // Используем значение, которое уже проверили
        const initData = currentInitData;
        console.log('Using validated initData:', initData);

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

// --- Добавлено: Попытка проверить initData сразу после инициализации ---
if (tg && tg.initData) {
    console.log('InitData IS available right after script load:', tg.initData);
} else {
    console.warn('InitData is NOT available right after script load.');
}
if (tg && tg.initDataUnsafe) {
    console.log('InitDataUnsafe IS available right after script load:', JSON.stringify(tg.initDataUnsafe));
} else {
     console.warn('InitDataUnsafe is NOT available right after script load.');
}
