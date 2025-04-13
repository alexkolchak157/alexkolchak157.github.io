// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Расширяем на весь экран

// URL вашего бэкенда для инициации платежа
// ЗАМЕНИТЕ на реальный URL, когда он будет готов
const INITIATE_PAYMENT_URL = 'https://webhook.обществонапальцах.рф/initiate-payment'; // Пример!

// --- Добавлено: Элемент для вывода ошибок на страницу ---
const errorDisplayElement = document.getElementById('error-message'); // Убедитесь, что у вас есть <div id="error-message"></div> в HTML

// Функция для показа ошибки на странице
function showClientError(message) {
    if (errorDisplayElement) {
        errorDisplayElement.textContent = message;
        errorDisplayElement.style.display = 'block'; // Показать элемент
    }
    // Дополнительно логируем в консоль
    console.error("Client Error:", message);
    // Попытка использовать tg.showAlert как fallback, если он вдруг заработает,
    // но лучше полагаться на вывод на страницу.
    // try { tg.showAlert(message); } catch (e) { console.warn("tg.showAlert failed:", e); }
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

    console.log('handlePurchaseClick called for productId:', productId); // Лог начала обработки

    if (!productId) {
        console.error('Не найден product ID на кнопке!');
        showClientError('Ошибка: Не найден ID продукта.');
        return;
    }

    // Показываем индикатор загрузки/ожидания
    tg.MainButton.setText('Обработка...');
    tg.MainButton.showProgress(true); // Показываем крутилку
    tg.MainButton.disable(); // Делаем главную кнопку неактивной
    button.disabled = true; // Делаем нажатую кнопку неактивной

    try {
        // --- Добавлено: Логирование перед получением initData ---
        console.log('Attempting to get initData. Current tg object:', window.Telegram.WebApp);
        const initData = tg.initData;
        console.log('Raw initData received:', initData); // Логируем полученное значение

        if (!initData) {
            // Выбрасываем ошибку, если initData пустое или undefined
            throw new Error('Не удалось получить данные инициализации Telegram (initData)');
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
                // Отправляем все initData для возможной валидации на бэкенде
                initData: initData
            }),
        });

        console.log('Backend response status:', response.status); // Лог статуса ответа

        // Пытаемся расшифровать ответ как JSON
        let responseData;
        const responseText = await response.text(); // Сначала получаем текст
        try {
            responseData = JSON.parse(responseText); // Потом парсим
        } catch (e) {
            console.error("Ошибка парсинга JSON ответа от бэкенда:", e);
            console.error("Текст ответа:", responseText); // Показать текст ответа, если он не JSON
            throw new Error(`Сервер вернул некорректный ответ (не JSON). Код: ${response.status}`);
        }

        console.log('Ответ от бэкенда (parsed):', responseData);

        // Проверяем ответ от бэкенда
        if (response.ok && responseData.success && responseData.paymentUrl) {
            // Если бэкенд вернул успех и ссылку на оплату - перенаправляем
            console.log('Redirecting to payment URL:', responseData.paymentUrl);
            window.location.href = responseData.paymentUrl;
            // После редиректа WebApp закроется, индикатор можно не убирать
        } else {
            // Если бэкенд вернул ошибку или некорректные данные
            throw new Error(responseData.error || `Ошибка инициации платежа от бэкенда. Код: ${response.status}`);
        }

    } catch (error) {
        console.error('Ошибка при инициации платежа (в блоке catch):', error);
        // Показываем сообщение об ошибке пользователю на странице
        showClientError(`Не удалось начать оплату: ${error.message}`);

        // Убираем индикатор загрузки и снова включаем кнопки
        try {
             tg.MainButton.hideProgress();
             tg.MainButton.enable();
             tg.MainButton.setText('Оплатить'); // Или исходный текст, который был
        } catch(uiError) {
            console.warn("Error resetting MainButton UI:", uiError);
        }
        button.disabled = false;
    }
}

// Находим все кнопки покупки
const purchaseButtons = document.querySelectorAll('.buy-button'); // Убедитесь, что у кнопок есть класс "buy-button"

// Добавляем обработчик к каждой кнопке
purchaseButtons.forEach(button => {
    button.addEventListener('click', handlePurchaseClick);
});

console.log("Telegram Web App script loaded and ready."); // Немного изменил сообщение

// --- Добавлено: Попытка проверить initData сразу после инициализации ---
if (tg.initData) {
    console.log('InitData IS available right after script load:', tg.initData);
} else {
    console.warn('InitData is NOT available right after script load.');
}
