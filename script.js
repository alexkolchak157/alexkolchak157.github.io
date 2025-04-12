// Получаем объект WebApp из глобального объекта Telegram
const tg = window.Telegram.WebApp;

// Вы можете использовать объект tg для взаимодействия с Telegram
// Например, чтобы узнать цвета темы:
// const themeParams = tg.themeParams;
// console.log("Theme:", themeParams);

// Говорим Telegram, что Web App готово к отображению
tg.ready();

// Пример: сделать так, чтобы кнопка "Назад" Telegram закрывала Web App
// tg.BackButton.show();
// tg.BackButton.onClick(() => {
//     tg.close();
// });

// Пример: показать основную кнопку Telegram (если нужна)
// tg.MainButton.setText("Закрыть");
// tg.MainButton.show();
// tg.MainButton.onClick(() => {
//     tg.close();
// });

console.log("Telegram Web App script loaded.");

// Пока больше ничего не делаем, страница статичная