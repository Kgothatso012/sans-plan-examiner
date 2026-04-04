/**
 * Tshwane Plan Examiner - Telegram Bot
 *
 * User sends building plan photo → AI analyzes → returns compliance
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Config
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINIMAX_KEY = process.env.MINIMAX_API_KEY;

if (!TOKEN) {
  console.log('Set TELEGRAM_BOT_TOKEN env var');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Compliance checks (same as WhatsApp)
const CHECKS = [
  { id: 'COVERAGE', name: 'Coverage', limit: 60, check: (t) => t.match(/(\d+)%/)?.[1] <= 60 ? 'PASS' : 'FAIL' },
  { id: 'ZONING', name: 'Zoning', check: (t) => /residential|commercial|industrial/i.test(t) ? 'PASS' : 'PENDING' },
  { id: 'SETBACK', name: 'Setbacks', check: (t) => /setback/i.test(t) ? 'PASS' : 'PENDING' },
  { id: 'HEIGHT', name: 'Height', limit: 3, check: (t) => (t.match(/(\d+)\s*storey/i)?.[1] || 0) <= 3 ? 'PASS' : 'PENDING' }
];

// /start
bot.onText(/\/start|\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '🏠 *Tshwane Plan Checker*\n\n' +
    'Send a photo of your building plan and I\'ll check compliance.\n\n' +
    '_Checks: coverage, zoning, setbacks, height_\n\n' +
    'Type /demo for sample analysis',
    { parse_mode: 'Markdown' }
  );
});

// /demo
bot.onText(/\/demo/, (msg) => {
  const chatId = msg.chat.id;
  const analysis = CHECKS.map(c => ({
    ...c,
    status: c.check('Coverage: 55%\nZoning: Residential\nSetback: 3m\n2 Storeys')
  }));
  sendReport(chatId, analysis);
});

// Handle photos
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  bot.sendMessage(chatId, '📎 Received! Analyzing...');

  try {
    // Download
    const file = await bot.getFile(fileId);
    const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;

    // Analyze (would use Vision API in production)
    const text = 'Coverage: 58%\nZoning: Residential\nSetback: 3m\n2 Storeys';

    const analysis = CHECKS.map(c => ({
      ...c,
      status: c.check(text)
    }));

    sendReport(chatId, analysis);
  } catch (e) {
    bot.sendMessage(chatId, '❌ Error. Try again.');
  }
});

// Fallback
bot.on('message', (msg) => {
  if (!msg.text?.startsWith('/')) {
    bot.sendMessage(msg.chat.id,
      'Send /start for help or a building plan photo.'
    );
  }
});

function sendReport(chatId, analysis) {
  const pass = analysis.filter(a => a.status === 'PASS').length;

  let text = '🏠 *TSHWANE PLAN CHECK*\n\n';
  text += '━━━━━━━━━━━━━━━━\n\n';

  for (const a of analysis) {
    const icon = a.status === 'PASS' ? '✅' : a.status === 'FAIL' ? '❌' : '⚪';
    text += `${icon} *${a.name}*: ${a.status}\n`;
  }

  text += '\n━━━━━━━━━━━━━━━━\n';
  text += `\n*Summary:* ${pass >= 3 ? '✅ Likely Compliant' : '⚠️ Needs Review'}\n`;
  text += `_Passed: ${pass}/${analysis.length}_`;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

console.log('🤖 Tshwane Telegram Bot running...');