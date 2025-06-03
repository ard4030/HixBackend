const TelegramBot = require('node-telegram-bot-api');

class TelegramBotListener {
  constructor(botToken, botName = 'Bot') {
    this.botToken = botToken;
    this.botName = botName;
    this.bot = new TelegramBot(botToken, { polling: true });

    console.log(`[${this.botName}] در حال گوش دادن به پیام‌ها...`);

    this.listen(); // متد گوش دادن بلافاصله اجرا میشه
  }

  listen() {
    this.bot.on('message', (msg) => this.onMessage(msg));
  }

  onMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`[${this.botName}] پیام دریافت شد از ${chatId}: ${text}`);

    // پاسخ تستی به فرستنده
    // this.bot.sendMessage(chatId, `📩 پیام شما دریافت شد:\n${text}`);
  }
}

module.exports =  {TelegramBotListener}