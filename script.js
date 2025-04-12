// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Расширяем на весь экран

// URL вашего бэкенда для инициации платежа
// ЗАМЕНИТЕ на реальный URL, когда он будет готов
const INITIATE_PAYMENT_URL = 'https://webhook.обществонапальцах.рф/initiate-payment'; // Пример!

// Функция обработки клика по кнопке покупки
async function handlePurchaseClick(event) {
    const button = event.currentTarget;
    const productId = button.dataset.productId;

    if (!productId) {
        console.error('Не найден product ID на кнопке!');
        tg.showAlert('Ошибка: Не найден ID продукта.');
        return;
    }

    // Показываем индикатор загрузки/ожидания
    tg.MainButton.setText('Обработка...');
    tg.MainButton.showProgress(true); // Показываем крутилку
    tg.MainButton.disable(); // Делаем главную кнопку неактивной
    button.disabled = true; // Делаем нажатую кнопку неактивной

    try {
        // Получаем все данные инициализации Telegram
        const initData = tg.initData;
        if (!initData) {
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

        // Пытаемся расшифровать ответ как JSON
        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            console.error("Ошибка парсинга JSON ответа от бэкенда:", e);
            console.error("Текст ответа:", await response.text()); // Показать текст ответа, если он не JSON
             throw new Error(`Сервер вернул некорректный ответ (не JSON). Код: ${response.status}`);
        }


        console.log('Ответ от бэкенда:', responseData);

        // Проверяем ответ от бэкенда
        if (response.ok && responseData.success && responseData.paymentUrl) {
            // Если бэкенд вернул успех и ссылку на оплату - перенаправляем
            window.location.href = responseData.paymentUrl;
            // После редиректа WebApp закроется, индикатор можно не убирать
        } else {
            // Если бэкенд вернул ошибку или некорректные данные
            throw new Error(responseData.error || `Ошибка инициации платежа. Код: ${response.status}`);
        }

    } catch (error) {
        console.error('Ошибка при инициации платежа:', error);
        // Показываем сообщение об ошибке пользователю
        tg.showAlert(`Не удалось начать оплату: ${error.message}`);
        // Убираем индикатор загрузки и снова включаем кнопки
        tg.MainButton.hideProgress();
        tg.MainButton.enable();
        tg.MainButton.setText('Оплатить'); // Или исходный текст
        button.disabled = false;
    }
}

// Находим все кнопки покупки
const purchaseButtons = document.querySelectorAll('.buy-button');

// Добавляем обработчик к каждой кнопке
purchaseButtons.forEach(button => {
    button.addEventListener('click', handlePurchaseClick);
});

console.log("Telegram Web App script loaded and ready for API payments.");