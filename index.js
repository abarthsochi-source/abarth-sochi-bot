const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

if (!TOKEN) throw new Error("BOT_TOKEN не задан");
if (!GROUP_ID) throw new Error("GROUP_ID не задан");

const bot = new TelegramBot(TOKEN, { polling: true });
const users = {};

const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚗 Забронировать", callback_data: "book" }],
      [
        { text: "📸 Каталог авто", callback_data: "catalog" },
        { text: "💰 Стоимость", callback_data: "price" }
      ],
      [
        { text: "📅 Даты", callback_data: "dates" },
        { text: "🎁 Акция 5+1", callback_data: "promo" }
      ],
      [
        { text: "📍 Контакты", callback_data: "contacts" },
        { text: "📲 Instagram", url: "https://instagram.com/abarth_sochi" }
      ]
    ]
  }
};

const carsMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "⚪ Белый Abarth", callback_data: "car_white" }],
      [{ text: "⚫ Серый Abarth", callback_data: "car_gray" }],
      [{ text: "Любой свободный", callback_data: "car_any" }]
    ]
  }
};

const daysMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "1 сутки", callback_data: "days_1" }],
      [{ text: "2 суток", callback_data: "days_2" }],
      [{ text: "3 суток", callback_data: "days_3" }],
      [{ text: "4 суток", callback_data: "days_4" }],
      [{ text: "5 суток 🎁 6-е в подарок", callback_data: "days_5" }]
    ]
  }
};

const confirmMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Отправить заявку", callback_data: "send_request" }],
      [{ text: "❌ Отменить", callback_data: "cancel" }]
    ]
  }
};

bot.onText(/\/start
