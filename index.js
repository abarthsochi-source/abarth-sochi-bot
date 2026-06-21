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

const PHONE_TEXT = "+7 (928) 400-07-16";
const WHATSAPP_TEXT = "https://wa.me/79284000716";

function money(n) {
  return `${n.toLocaleString("ru-RU")} ₽`;
}

function calculatePrice(days, delivery) {
  const freeDays = Math.floor(days / 7);
  const rentBeforeDiscount = days * PRICE_PER_DAY;
  const discount = freeDays * PRICE_PER_DAY;
  const rentAfterDiscount = rentBeforeDiscount - discount;
  const deliveryCost = delivery ? DELIVERY_PRICE : 0;
  const total = rentAfterDiscount + deliveryCost;

  return {
    freeDays,
    rentBeforeDiscount,
    discount,
    deliveryCost,
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
        [{ text: "⭐ Отзывы / Яндекс Карты", callback_data: "reviews" }],
        [{ text: "📞 Контакты", callback_data: "contacts" }]
      ]
    }
  };
}

function backMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅️ Главное меню", callback_data: "main" }]
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

function carTitle(code) {
  if (code === "white") return "White Abarth Cabrio";
  if (code === "grey") return "Grey Abarth Cabrio";
  return "Abarth Cabrio";
}

function shortCalc(user) {
  const calc = calculatePrice(user.days, user.delivery);

  return `💰 РАСЧЕТ

🚗 ${user.car}
📅 ${user.date}
⏳ ${user.days} суток
🚘 ${user.delivery ? "Подача +1 500 ₽" : "Без подачи"}

Аренда: ${money(calc.rentBeforeDiscount)}
Скидка: -${money(calc.discount)}
Итого: ${money(calc.total)}

Залог: ${money(DEPOSIT)}`;
}

function requestText(user, from) {
  const calc = calculatePrice(user.days, user.delivery);

  return `🦂 ABARTH SOCHI
НОВАЯ ЗАЯВКА

🚗 ${user.car}
📅 ${user.date}
⏳ ${user.days} суток
🚘 ${user.delivery ? "Подача +1 500 ₽" : "Без подачи"}

💰 Аренда: ${money(calc.rentBeforeDiscount)}
🎁 Скидка: -${money(calc.discount)}
💳 Итого: ${money(calc.total)}
🔒 Залог: ${money(DEPOSIT)}

👤 ${user.name}
📞 ${user.phone}
💬 ${user.comment || "—"}

Telegram: ${from.username ? "@" + from.username : "не указан"}`;
}

async function showMain(chatId) {
  return bot.sendMessage(
    chatId,
`🦂 ABARTH SOCHI

Итальянские кабриолеты
для ярких эмоций в Сочи.

Выберите действие:`,
    mainMenu()
  );
}

async function sendCarCards(chatId, withButtons = true) {
  const whiteOptions = {
    caption:
`⚪ WHITE ABARTH CABRIO

Итальянский кабриолет
для ярких поездок по Сочи.

7 000 ₽ / сутки
7 суток = оплата за 6
Залог: 5 000 ₽`
  };

  const greyOptions = {
    caption:
`⚫ GREY ABARTH CABRIO

Стиль, звук и эмоции
в каждой поездке.

7 000 ₽ / сутки
7 суток = оплата за 6
Залог: 5 000 ₽`
  };

  if (withButtons) {
    whiteOptions.reply_markup = {
      inline_keyboard: [
        [{ text: "✅ Выбрать White Abarth", callback_data: "car_white" }]
      ]
    };

    greyOptions.reply_markup = {
      inline_keyboard: [
        [{ text: "✅ Выбрать Grey Abarth", callback_data: "car_grey" }]
      ]
    };
  }

  await bot.sendPhoto(chatId, WHITE_PHOTO_ID, whiteOptions);
  await bot.sendPhoto(chatId, GREY_PHOTO_ID, greyOptions);
}

bot.onText(/\/start/, (msg) => {
  users[msg.chat.id] = {};
  showMain(msg.chat.id);
});
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!users[chatId]) users[chatId] = {};
  const user = users[chatId];

  await bot.answerCallbackQuery(query.id);

  if (data === "main") {
    return showMain(chatId);
  }

  if (data === "catalog") {
    return sendCarCards(chatId, false);
  }

  if (data === "book") {
    return sendCarCards(chatId, true);
  }

  if (data === "price") {
    return bot.sendMessage(
      chatId,
`💰 СТОИМОСТЬ

1 сутки — 7 000 ₽

🎁 Акция:
7 суток = оплата за 6

🚘 Подача авто:
+1 500 ₽

🔒 Залог:
5 000 ₽`,
      backMenu()
    );
  }

  if (data === "rules") {
    return bot.sendMessage(
      chatId,
`📋 УСЛОВИЯ

• Возраст от 21 года
• Стаж от 3 лет
• Паспорт РФ
• Залог 5 000 ₽
• Бережная эксплуатация`,
      backMenu()
    );
  }

  if (data === "reviews") {
    return bot.sendMessage(
      chatId,
`⭐ ОТЗЫВЫ

Нас можно найти на Яндекс Картах.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🗺 Яндекс Карты", url: YANDEX_MAPS_URL }],
            [{ text: "⬅️ Главное меню", callback_data: "main" }]
          ]
        }
      }
    );
  }

  if (data === "contacts") {
    return bot.sendMessage(
      chatId,
`📞 КОНТАКТЫ

🦂 ABARTH SOCHI

👤 Илья
📱 ${PHONE_TEXT}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 WhatsApp", url: WHATSAPP_TEXT }],
            [{ text: "🗺 Яндекс Карты", url: YANDEX_MAPS_URL }],
            [{ text: "⬅️ Главное меню", callback_data: "main" }]
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
      "📅 Напишите дату аренды\n\nНапример:\n23 июня"
    );
  }

  if (data === "delivery_yes") {
    user.delivery = true;
    user.step = "name";

    return bot.sendMessage(chatId, "👤 Ваше имя?");
  }

  if (data === "delivery_no") {
    user.delivery = false;
    user.step = "name";

    return bot.sendMessage(chatId, "👤 Ваше имя?");
  }

  if (data === "send_request") {
    await bot.sendMessage(
      GROUP_ID,
      requestText(user, query.from)
    );

    users[chatId] = {};

    return bot.sendMessage(
      chatId,
      "✅ Заявка отправлена. Мы скоро свяжемся с вами."
    );
  }

  if (data === "cancel") {
    users[chatId] = {};
    return showMain(chatId);
  }
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;

  if (!users[chatId]) return;

  const user = users[chatId];

  if (user.step === "date") {
    user.date = msg.text;
    user.step = "days";

    return bot.sendMessage(
      chatId,
      "⏳ На сколько суток?\n\nНапример:\n7"
    );
  }

  if (user.step === "days") {
    user.days = parseInt(msg.text);

    if (!user.days || user.days < 1) {
      return bot.sendMessage(chatId, "Введите количество суток.");
    }

    user.step = "delivery";

    return bot.sendMessage(
      chatId,
      "🚘 Нужна ли подача автомобиля?",
      deliveryMenu()
    );
  }

  if (user.step === "name") {
    user.name = msg.text;
    user.step = "phone";

    return bot.sendMessage(chatId, "📞 Ваш номер телефона?");
  }

  if (user.step === "phone") {
    user.phone = msg.text;
    user.step = "comment";

    return bot.sendMessage(
      chatId,
      "💬 Комментарий?\nЕсли нет — напишите: нет"
    );
  }

  if (user.step === "comment") {
    user.comment = msg.text.toLowerCase() === "нет" ? "" : msg.text;
    user.step = "confirm";

    return bot.sendMessage(
      chatId,
      `✅ ПРОВЕРЬТЕ ЗАЯВКУ

🚗 ${user.car}
📅 ${user.date}
⏳ ${user.days} суток

${shortCalc(user)}

👤 ${user.name}
📞 ${user.phone}

Отправить заявку?`,
      confirmMenu()
    );
  }
});

console.log("ABARTH SOCHI BOT STARTED");
