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

const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚗 Забронировать", callback_data: "book" }],
      [{ text: "📸 Каталог авто", callback_data: "catalog" }],
      [{ text: "💰 Стоимость", callback_data: "price" }],
      [{ text: "🎁 Акция 5+1", callback_data: "promo" }],
      [{ text: "📍 Контакты", callback_data: "contacts" }]
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

bot.onText(/\/start/, (msg) => {
  users[msg.chat.id] = {};
  bot.sendMessage(
    msg.chat.id,
    "🦂 ABARTH SOCHI\n\nАренда Abarth Cabrio в Сочи.\n\nВыберите действие:",
    mainMenu
  );
});

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  if (!users[chatId]) users[chatId] = {};

  await bot.answerCallbackQuery(q.id);

  if (data === "book") {
    users[chatId].step = "car";
    return bot.sendMessage(chatId, "🚗 Выберите автомобиль:", carsMenu);
  }

  if (data === "catalog") {
    return bot.sendMessage(
      chatId,
      "📸 Каталог авто\n\n⚪ Белый Abarth Cabrio\n⚫ Серый Abarth Cabrio\n\nКабриолет, спортивный звук, эмоции Сочи.",
      mainMenu
    );
  }

  if (data === "price") {
    return bot.sendMessage(
      chatId,
      "💰 Стоимость\n\n7 000 ₽ / сутки\nЗалог: 5 000 ₽\n\n🎁 Акция: берёте 5 суток — 6-е сутки в подарок.",
      mainMenu
    );
  }

  if (data === "promo") {
    return bot.sendMessage(
      chatId,
      "🎁 Акция 5+1\n\nБерёте Abarth на 5 суток — 6-е сутки бесплатно.",
      mainMenu
    );
  }

  if (data === "contacts") {
    return bot.sendMessage(
      chatId,
      "📍 Сочи\n📲 Instagram: @abarth_sochi\n☎️ Телефон / WhatsApp: добавь номер",
      mainMenu
    );
  }

  if (data.startsWith("car_")) {
    users[chatId].car =
      data === "car_white" ? "Белый Abarth" :
      data === "car_gray" ? "Серый Abarth" :
      "Любой свободный Abarth";

    users[chatId].step = "date";
    return bot.sendMessage(chatId, "📅 Напишите дату аренды. Например: 25 июня");
  }

  if (data.startsWith("days_")) {
    const days = data.replace("days_", "");
    users[chatId].days = days === "5" ? "5 суток + 6-е в подарок" : `${days} суток`;
    users[chatId].promo = days === "5";
    users[chatId].step = "name";
    return bot.sendMessage(chatId, "👤 Как к вам обращаться?");
  }

  if (data === "cancel") {
    users[chatId] = {};
    return bot.sendMessage(chatId, "Заявка отменена.", mainMenu);
  }

  if (data === "send_request") {
    const u = users[chatId];

    const requestText =
`🆕 НОВАЯ ЗАЯВКА ABARTH SOCHI

🚗 Авто: ${u.car}
📅 Дата: ${u.date}
⏳ Срок: ${u.days}
🎁 Акция: ${u.promo ? "6-е сутки бесплатно" : "—"}
👤 Имя: ${u.name}
📞 Телефон: ${u.phone}
💬 Комментарий: ${u.comment || "—"}

Telegram: ${q.from.username ? "@" + q.from.username : "не указан"}`;

    try {
  await bot.sendMessage(GROUP_ID, requestText);
} catch (err) {
  console.error("Ошибка отправки заявки в группу:", err.message);
  return bot.sendMessage(chatId, "❌ Заявка заполнена, но не отправилась в группу. Проверьте GROUP_ID и права бота.");
}


    return bot.sendMessage(
      chatId,
      "✅ Заявка отправлена! Скоро с вами свяжутся.",
      mainMenu
    );
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;
  if (!users[chatId]) users[chatId] = {};

  const u = users[chatId];

  if (u.step === "date") {
    u.date = text;
    u.step = "days";
    return bot.sendMessage(chatId, "⏳ На сколько суток?", daysMenu);
  }

  if (u.step === "name") {
    u.name = text;
    u.step = "phone";
    return bot.sendMessage(chatId, "📞 Напишите номер телефона:");
  }

  if (u.step === "phone") {
    u.phone = text;
    u.step = "comment";
    return bot.sendMessage(chatId, "💬 Комментарий? Если нет — напишите «нет».");
  }

  if (u.step === "comment") {
    u.comment = text.toLowerCase() === "нет" ? "" : text;
    u.step = "confirm";

    return bot.sendMessage(
      chatId,
      `✅ Проверьте заявку:\n\n🚗 ${u.car}\n📅 ${u.date}\n⏳ ${u.days}\n👤 ${u.name}\n📞 ${u.phone}\n💬 ${u.comment || "—"}\n\nОтправить заявку?`,
      confirmMenu
    );
  }
});
bot.on("photo", (msg) => {
  const photo = msg.photo[msg.photo.length - 1];
  bot.sendMessage(msg.chat.id, `file_id:\n${photo.file_id}`);
});
console.log("ABARTH SOCHI BOT запущен");
