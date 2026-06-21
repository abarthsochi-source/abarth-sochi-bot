const TelegramBot = require("node-telegram-bot-api");
const http = require("http");

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("ABARTH SOCHI BOT OK");
}).listen(process.env.PORT || 3000);

const TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

if (!TOKEN) throw new Error("BOT_TOKEN не задан");
if (!GROUP_ID) throw new Error("GROUP_ID не задан");

const bot = new TelegramBot(TOKEN, { polling: true });
const users = {};

const PRICE_PER_DAY = 7000;
const DEPOSIT = 5000;
const DELIVERY_PRICE = 1500;

const WHITE_PHOTO_ID = "AgACAgIAAxkBAAN5ajhUb0wlnEeYHvIQWl7B-heU5r0AAvsaaxtWV8BJbL25DJtHvSwBAAMCAAN5AAM8BA";
const GREY_PHOTO_ID = "AgACAgIAAxkBAAN3ajhT1vNePAFWkSGNBQWUAUMBiEUAAvgaaxtWV8BJTMxw1vwa1nABAAMCAAN5AAM8BA";

const YANDEX_MAPS_URL = "https://yandex.ru/navi/org/abarth/86845691589?si=qf1kygj05v7c6wchjw45efrdqm";
const PHONE_DISPLAY = "+7 (928) 400-07-16";
const PHONE_LINK = "tel:+79284000716";
const WHATSAPP_LINK = "https://wa.me/79284000716";

function formatRub(amount) {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

function calculatePrice(days, delivery) {
  const freeDays = Math.floor(days / 7);
  const paidDays = days - freeDays;
  const rentBeforeDiscount = days * PRICE_PER_DAY;
  const discount = freeDays * PRICE_PER_DAY;
  const rentTotal = paidDays * PRICE_PER_DAY;
  const deliveryTotal = delivery ? DELIVERY_PRICE : 0;
  const total = rentTotal + deliveryTotal;

  return {
    days,
    freeDays,
    paidDays,
    rentBeforeDiscount,
    discount,
    rentTotal,
    deliveryTotal,
    total
  };
}

function mainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚗 Забронировать", callback_data: "book" }],
        [{ text: "📸 Каталог", callback_data: "catalog" }],
        [{ text: "💰 Стоимость", callback_data: "price" }],
        [{ text: "📋 Условия аренды", callback_data: "rules" }],
        [{ text: "⭐ Отзывы", callback_data: "reviews" }],
  ]
    }
  };
}

function backMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅️ В главное меню", callback_data: "main" }]
      ]
    }
  };
}

function deliveryMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Нужна подача +1 500 ₽", callback_data: "delivery_yes" }],
        [{ text: "❌ Без подачи", callback_data: "delivery_no" }]
      ]
    }
  };
}

function continueMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Продолжить оформление", callback_data: "continue_order" }],
        [{ text: "⬅️ В главное меню", callback_data: "main" }]
      ]
    }
  };
}

function confirmMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Отправить заявку", callback_data: "send_request" }],
        [{ text: "❌ Отменить", callback_data: "cancel" }]
      ]
    }
  };
}
async function showMain(chatId) {
  return bot.sendMessage(
    chatId,
`━━━━━━━━━━━━━━

🦂 ABARTH SOCHI

Итальянские кабриолеты
для ярких эмоций в Сочи

━━━━━━━━━━━━━━

Выберите действие:`,
    mainMenu()
  );
}

async function sendCarCards(chatId) {
  await bot.sendPhoto(chatId, WHITE_PHOTO_ID, {
    caption:
`━━━━━━━━━━━━━━

⚪ WHITE ABARTH CABRIO

Итальянский кабриолет
для ярких поездок по Сочи

💰 7 000 ₽ / сутки
🎁 7 суток = оплата за 6
🔒 Залог 5 000 ₽
📏 Пробег 200 км / сутки

━━━━━━━━━━━━━━`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Выбрать White Abarth", callback_data: "car_white" }]
      ]
    }
  });

  await bot.sendPhoto(chatId, GREY_PHOTO_ID, {
    caption:
`━━━━━━━━━━━━━━

⚫ GREY ABARTH CABRIO

Стиль, звук и эмоции
в каждой поездке

💰 7 000 ₽ / сутки
🎁 7 суток = оплата за 6
🔒 Залог 5 000 ₽
📏 Пробег 200 км / сутки

━━━━━━━━━━━━━━`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Выбрать Grey Abarth", callback_data: "car_grey" }]
      ]
    }
  });
}

function carTitle(code) {
  if (code === "white") return "White Abarth Cabrio";
  if (code === "grey") return "Grey Abarth Cabrio";
  return "Abarth Cabrio";
}

function buildCalculationText(user) {
  const calc = calculatePrice(user.days, user.delivery);

  return `━━━━━━━━━━━━━━

💰 РАСЧЕТ АРЕНДЫ

🚗 ${user.car}

📅 ${user.date}
⏳ ${user.days} суток

━━━━━━━━━━━━━━

Стоимость аренды

${user.days} × ${formatRub(PRICE_PER_DAY)}
${formatRub(calc.rentBeforeDiscount)}

🎁 Акция 6+1

−${formatRub(calc.discount)}

🚘 Подача автомобиля

${user.delivery ? "+ " + formatRub(DELIVERY_PRICE) : "не требуется"}

━━━━━━━━━━━━━━

💳 ИТОГО

${formatRub(calc.total)}

🔒 Залог ${formatRub(DEPOSIT)}
📏 Пробег 200 км / сутки

━━━━━━━━━━━━━━`;
}

function buildRequestText(user, from) {
  const calc = calculatePrice(user.days, user.delivery);

  return `━━━━━━━━━━━━━━

🦂 ABARTH SOCHI

НОВАЯ ЗАЯВКА

━━━━━━━━━━━━━━
🚗 Автомобиль
${user.car}

📅 Дата
${user.date}

⏳ Срок
${user.days} суток

🚘 Подача
${user.delivery ? "Да, +1 500 ₽" : "Нет"}

━━━━━━━━━━━━━━
💰 Аренда
${formatRub(calc.rentBeforeDiscount)}

🎁 Скидка
−${formatRub(calc.discount)}

💳 ИТОГО
${formatRub(calc.total)}

🔒 Залог
${formatRub(DEPOSIT)}

━━━━━━━━━━━━━━
👤 Клиент
${user.name}

📞 Телефон
${user.phone}

💬 Комментарий
${user.comment || "—"}

Telegram
${from.username ? "@" + from.username : "не указан"}

━━━━━━━━━━━━━━`;
}

bot.onText(/\/start/, (msg) => {
  users[msg.chat.id] = {};
  showMain(msg.chat.id);
});
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  if (!users[chatId]) users[chatId] = {};
  const user = users[chatId];

  await bot.answerCallbackQuery(q.id);

  if (data === "main") {
    return showMain(chatId);
  }

  if (data === "book") {
    users[chatId] = {};
    return sendCarCards(chatId);
  }

  if (data === "catalog") {
    return sendCarCards(chatId);
  }

  if (data === "price") {
    return bot.sendMessage(
      chatId,
`━━━━━━━━━━━━━━

💰 СТОИМОСТЬ

7 000 ₽ / сутки

🎁 Акция 6+1

При аренде на 7 суток
оплачивается только 6.

🚘 Подача автомобиля
+1 500 ₽

🔒 Возвратный залог
5 000 ₽

━━━━━━━━━━━━━━`,
      backMenu()
    );
  }

  if (data === "rules") {
    return bot.sendMessage(
      chatId,
`━━━━━━━━━━━━━━

📋 УСЛОВИЯ АРЕНДЫ

👤 Возраст водителя
от 22 лет

📏 Лимит пробега
200 км / сутки

🔒 Возвратный залог
5 000 ₽

🚘 Подача автомобиля
1 500 ₽

🎁 Акция
7 суток = оплата за 6

━━━━━━━━━━━━━━`,
      backMenu()
    );
  }

  if (data === "reviews") {
    return bot.sendMessage(
      chatId,
`━━━━━━━━━━━━━━

⭐ ОТЗЫВЫ КЛИЕНТОВ

ABARTH SOCHI

Нам доверяют жители
и гости Сочи.

━━━━━━━━━━━━━━`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🗺 Яндекс Карты", url: YANDEX_MAPS_URL }],
            [{ text: "⬅️ В главное меню", callback_data: "main" }]
          ]
        }
      }
    );
  }

  if (data === "contacts") {
    return bot.sendMessage(
      chatId,
`━━━━━━━━━━━━━━

📞 КОНТАКТЫ

🦂 ABARTH SOCHI

👤 Илья

📱 ${PHONE_DISPLAY}

━━━━━━━━━━━━━━`,
      {
        reply_markup: {
          inline_keyboard: [
    [{ text: "💬 WhatsApp", url: WHATSAPP_LINK }],
    [{ text: "🗺 Яндекс Карты", url: YANDEX_MAPS_URL }]
          ]
        }
      }
    );
  }

  if (data.startsWith("car_")) {
    const carCode = data.replace("car_", "");

    user.carCode = carCode;
    user.car = carTitle(carCode);
    user.step = "date";

    return bot.sendMessage(
      chatId,

📅 Напишите дату аренды

Например:

23 июня`
    );
  }

  if (data === "delivery_yes" || data === "delivery_no") {
    user.delivery = data === "delivery_yes";

    await bot.sendMessage(
      chatId,
      buildCalculationText(user),
      continueMenu()
    );

    user.step = "name";

    return;
  }

  if (data === "continue_order") {
    return bot.sendMessage(
      chatId,
      "👤 Как к вам обращаться?"
    );
  }
});
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;
  if (!users[chatId]) users[chatId] = {};

  const user = users[chatId];

  if (user.step === "date") {
    user.date = text;
    user.step = "days";

    return bot.sendMessage(
      chatId,

⏳ На сколько суток?

Напишите число.
Например:

7`
    );
  }

  if (user.step === "days") {
    const days = parseInt(text, 10);

    if (!days || days < 1) {
      return bot.sendMessage(chatId, "Напишите количество суток числом. Например: 7");
    }

    user.days = days;
    user.step = "delivery";

    return bot.sendMessage(
      chatId,

🚘 Нужна ли подача автомобиля?`,
      deliveryMenu()
    );
  }

  if (user.step === "name") {
    user.name = text;
    user.step = "phone";

    return bot.sendMessage(chatId, "📞 Напишите номер телефона:");
  }

  if (user.step === "phone") {
    user.phone = text;
    user.step = "comment";

    return bot.sendMessage(chatId, "💬 Комментарий? Если нет — напишите «нет».");
  }

  if (user.step === "comment") {
    user.comment = text.toLowerCase() === "нет" ? "" : text;
    user.step = "confirm";

    return bot.sendMessage(
      chatId,
`━━━━━━━━━━━━━━

✅ ПРОВЕРЬТЕ ЗАЯВКУ

🚗 ${user.car}
📅 ${user.date}
⏳ ${user.days} суток
🚘 Подача: ${user.delivery ? "Да" : "Нет"}

💳 К оплате:
${formatRub(calculatePrice(user.days, user.delivery).total)}

🔒 Залог:
${formatRub(DEPOSIT)}

Отправить заявку?
      confirmMenu()
    );
  }
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  if (!users[chatId]) users[chatId] = {};
  const user = users[chatId];

  if (data === "cancel") {
    users[chatId] = {};
    return bot.sendMessage(chatId, "Заявка отменена.", mainMenu());
  }

  if (data === "send_request") {
    const requestText = buildRequestText(user, q.from);

    try {
      await bot.sendMessage(GROUP_ID, requestText);
    } catch (err) {
      console.error("Ошибка отправки заявки в группу:", err.message);

      return bot.sendMessage(
        chatId,
        "❌ Заявка заполнена, но не отправилась в группу. Проверьте GROUP_ID и права бота."
      );
    }

    users[chatId] = {};

    return bot.sendMessage(
      chatId,
`━━━━━━━━━━━━━━

✅ Заявка отправлена

Наш менеджер свяжется с вами
в ближайшее время.

━━━━━━━━━━━━━━`,
      mainMenu()
    );
  }
});

console.log("ABARTH SOCHI BOT v2.0 запущен");
