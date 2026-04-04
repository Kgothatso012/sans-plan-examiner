/**
 * Tshwane Zoning FAQ Bot
 *
 * Answers common zoning questions automatically
 */

const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.log('Set TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// FAQ Database - Common questions and answers
const FAQ = [
  {
    keywords: ['second dwelling', 'granny flat', 'flatlet', 'additional'],
    answer: `🏠 *Second Dwelling*

Yes, allowed under certain conditions:
• Max 80m² floor area
• Must be on same erf as primary dwelling
• One parking bay required
• Builder must be registered

Apply: Use Form B at Building Control.`
  },
  {
    keywords: ['pool', 'swimming pool', 'pool house'],
    answer: `🏊 *Swimming Pool*

_allowed:_
• Max 50m² surface area
• Min 1.5m from boundary
• Filter/泵 must be in servitude

_apply:_
• Building plans not required
• NBR application only
• Approval: ~2 weeks`
  },
  {
    keywords: ['coverage', 'coverage ratio', 'how big'],
    answer: `📐 *Coverage Ratio*

Residential:
• Default: 60% max coverage
• Can apply for 75% if:
  - Subsoil drainage installed
  - Stormwater handled on-site

_*Note:* Each erf is unique. Check your zoning with Building Control.`
  },
  {
    keywords: ['height', 'storey', 'storeys', 'tall'],
    answer: `🏢 *Building Height*

• Default: 2 storeys (8m)
• 3+ storeys requires:
  - Traffic impact assessment
  -邻居 neighbor comments
  - Council approval

_*Slope erf_ may have different rules.`
  },
  {
    keywords: ['subdivision', 'split', 'divide'],
    answer: `✂️ *Subdivision*

_process:_
1. Surveyor to peg erf
2. Application to Town Planning
3. Engineer foundation report
4. ~3-6 months processing

_*Cost:* Varies by erf size. Ask for quote.`
  },
  {
    keywords: ['tar', 'paving', 'driveway', 'parking'],
    answer: `🚗 *Paving/Parking*

• No approval needed for:
  - Domestic paving
  - Max 5 parking bays

• Approval needed for:
  - Commercial parking
  - > 5 bays`
  },
  {
    keywords: ['boundary', 'wall', 'fence'],
    answer: `🧱 *Boundary Wall*

• Max 1.8m front boundary
• Max 2.1m rear/side boundary
• Brick/concrete requires:
  - Building plans
  - Structural engineer sign-off`
  },
  {
    keywords: ['apply', 'application', 'how to apply', 'documents'],
    answer: `📋 *How to Apply*

_Required:_
1. Form B (application form)
2. Building plans (3 copies)
3. SDB6 (site plan)
4. Proof of ownership
5. ID copies

_Submit to:_
Building Control, 8th Floor
Tshwane Civic Center`
  },
  {
    keywords: ['time', 'how long', 'processing'],
    answer: `⏱️ *Processing Time*

• Minor: 2-4 weeks
• Standard: 4-8 weeks
• Complex: 8-12+ weeks

_*Times are estimates. May vary._`
  },
  {
    keywords: ['cost', 'fee', ' charge', 'price'],
    answer: `💰 *Application Fees*

• Dwelling: ~R1,500
• Addition: ~R800
• Pool: ~R500
• Boundary wall: ~R400

_*Exact fees per current tariff._`
  }
];

// Default response
const DEFAULT = `抱歉 I didn't understand that question.

For help, contact Building Control:
• 📞 012 358 9999
• 📧 building.control@tshwane.gov.za
• 🏢 8th Floor, Tshwane Civic Center

_Type /help for bot commands._`;

// /start
bot.onText(/\/start|\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '🏠 *Tshwane Zoning FAQ Bot*\n\n' +
    'Ask me about:\n' +
    '• Second dwellings/pools\n' +
    '• Coverage ratios\n' +
    '• Building heights\n' +
    '• Application process\n' +
    '• Fees and times\n\n' +
    '_Type your question in English_',
    { parse_mode: 'Markdown' }
  );
});

// Handle all messages
bot.on('message', (msg) => {
  if (msg.text?.startsWith('/')) return;

  const text = (msg.text || '').toLowerCase();

  // Find matching FAQ
  for (const faq of FAQ) {
    for (const keyword of faq.keywords) {
      if (text.includes(keyword)) {
        bot.sendMessage(msg.chat.id, faq.answer, { parse_mode: 'Markdown' });
        return;
      }
    }
  }

  // No match
  bot.sendMessage(msg.chat.id, DEFAULT, { parse_mode: 'Markdown' });
});

console.log('🏠 Tshwane Zoning FAQ Bot running...');