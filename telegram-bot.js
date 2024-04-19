const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = '7134153113:AAF04tcxnKMN-A7x3L9TI6jsxeX5719OUQY';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

let sell_limit, buy_limit;
// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, sell_limit + buy_limit);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.onText(/\/sell limit (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  sell_limit = match[1]; // the captured "whatever"

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Successfully set limit');
});

bot.onText(/\/buy limit (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    buy_limit = match[1]; // the captured "whatever"
  
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Successfully set limit');
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('help', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});