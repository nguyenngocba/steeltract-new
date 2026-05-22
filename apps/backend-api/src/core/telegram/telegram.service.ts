import TelegramBot from 'node-telegram-bot-api'

const bot =
  new TelegramBot(
    'YOUR_BOT_TOKEN',
    {
      polling: false,
    },
  )

export async function sendTelegram(
  message: string,
) {
  try {
    await bot.sendMessage(
      'YOUR_CHAT_ID',
      message,
    )
  } catch {}
}
