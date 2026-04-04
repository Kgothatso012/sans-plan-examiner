/**
 * Tshwane Complaint Triage Bot
 *
 * AI categorizes incoming complaints and routes to correct department
 */

const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.log('Set TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Complaint categories and keywords
const CATEGORIES = [
  {
    id: 'ROADS',
    name: 'Roads & Potholes',
    keywords: ['pothole', 'road', 'street', 'speed bump', 'speedhump', 'traffic', 'sign'],
    urgency: 'medium',
    department: 'Roads & Transport',
    sla: '14 days'
  },
  {
    id: 'WATER',
    name: 'Water & Sanitation',
    keywords: ['water', 'leak', 'pipe', 'drainage', 'sewer', 'toilet', 'no water', 'low pressure'],
    urgency: 'high',
    department: 'Water & Sanitation',
    sla: '48 hours'
  },
  {
    id: 'ELECTRICITY',
    name: 'Electricity',
    keywords: ['electric', 'power', 'lights', 'eskom', 'outage', 'pole', 'cable', 'street light'],
    urgency: 'medium',
    department: 'Energy & Electricity',
    sla: '7 days'
  },
  {
    id: 'REFUSE',
    name: 'Refuse & Cleaning',
    keywords: ['rubbish', 'illegal dumping', 'bin', 'clean', 'litter', 'dump', 'waste'],
    urgency: 'low',
    department: 'Environmental Health',
    sla: '7 days'
  },
  {
    id: 'PARKS',
    name: 'Parks & Recreation',
    keywords: ['park', 'tree', 'grass', 'playground', 'garden', 'sports field'],
    urgency: 'low',
    department: 'Parks & Recreation',
    sla: '21 days'
  },
  {
    id: 'BUILDING',
    name: 'Building Control',
    keywords: ['unlicensed', 'illegal building', 'construction', 'unapproved'],
    urgency: 'medium',
    department: 'Building Control',
    sla: '14 days'
  },
  {
    id: 'NOISE',
    name: 'Noise & Nuisance',
    keywords: ['noise', 'loud', 'music', 'party', 'business', 'nuisance'],
    urgency: 'low',
    department: 'Environmental Health',
    sla: '7 days'
  },
  {
    id: 'STORMWATER',
    name: 'Stormwater',
    keywords: ['flood', 'stormwater', 'drain', 'blocked drain', 'erosion'],
    urgency: 'high',
    department: 'Stormwater',
    sla: '48 hours'
  }
];

// /start
bot.onText(/\/start|\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '📢 *Tshwane Complaint Bot*\n\n' +
    'Describe your issue and I\'ll:\n' +
    '1. Categorize it\n' +
    '2. Route to correct department\n' +
    '3. Give reference number\n\n' +
    '_Report: potholes, water leaks, illegal dumping, etc._',
    { parse_mode: 'Markdown' }
  );
});

// Handle complaint text
bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/')) return;

  const text = (msg.text || '').toLowerCase();
  if (text.length < 10) {
    bot.sendMessage(msg.chat.id, 'Please describe your issue more fully.');
    return;
  }

  // Find category
  let category = null;
  for (const cat of CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (text.includes(keyword)) {
        category = cat;
        break;
      }
    }
    if (category) break;
  }

  // Default category
  if (!category) {
    category = {
      id: 'GENERAL',
      name: 'General Inquiry',
      keywords: [],
      urgency: 'medium',
      department: 'Client Services',
      sla: '14 days'
    };
  }

  // Generate reference
  const ref = `TC${Date.now().toString().slice(-8)}`;

  // Acknowledge
  bot.sendMessage(msg.chat.id, '✅ Complaint received!');

  // Send to admin (if configured)
  // bot.sendMessage(ADMIN_ID, `Complaint: ${ref}\nFrom: ${msg.from.username}\nText: ${msg.text}`);

  // Send reference to user
  let response = `📢 *COMPLAINT RECEIVED*\n\n`;
  response += `━━━━━━━━━━━━━━━━\n\n`;
  response += `*Reference:* ${ref}\n\n`;
  response += `*Category:* ${category.name}\n`;
  response += `*Department:* ${category.department}\n`;
  response += `*Urgency:* ${category.urgency}\n`;
  response += `*SLA:* ${category.sla}\n\n`;
  response += `━━━━━━━━━━━━━━━━\n\n`;
  response += `_Your complaint has been logged._\n`;
  response += `_Reference this number in all follow-ups._`;

  bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown' });
});

console.log('📢 Tshwane Complaint Triage Bot running...');