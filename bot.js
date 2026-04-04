/**
 * Unified Bot Handler
 * 
 * Handles both WhatsApp and Telegram - same logic, different APIs
 * All calls go through the unified API at /api/
 * 
 * Usage:
 *   npm install
 *   node bot.js
 * 
 * Telegram: Set webhook to this server
 * WhatsApp: Set webhook to this server (Cloud API)
 */

const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// ============================================
// CONFIG
// ============================================

const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  whatsappToken: process.env.WHATSAPP_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  adminChatId: process.env.ADMIN_CHAT_ID,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
};

let supabase = null;
if (CONFIG.supabaseUrl && CONFIG.supabaseKey) {
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
}

// ============================================
// HELPERS
// ============================================

async function callAPI(endpoint, data) {
  try {
    const response = await axios.post(`${CONFIG.apiUrl}/api/${endpoint}`, data, {
      timeout: 30000
    });
    return response.data;
  } catch (err) {
    console.error(`API error: ${err.message}`);
    return { error: err.message };
  }
}

async function sendTelegram(chatId, text, keyboard = null) {
  if (!CONFIG.telegramToken) return;
  
  const payload = { chat_id: chatId, text };
  if (keyboard) {
    payload.reply_markup = keyboard;
  }
  
  await axios.post(`https://api.telegram.org/bot${CONFIG.telegramToken}/sendMessage`, payload);
}

async function sendWhatsApp(to, text) {
  if (!CONFIG.whatsappToken || !CONFIG.whatsappPhoneNumberId) return;
  
  await axios.post('https://graph.facebook.com/v21.0/' + CONFIG.whatsappPhoneNumberId + '/messages', {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  }, {
    headers: { 'Authorization': `Bearer ${CONFIG.whatsappToken}` }
  });
}

// ============================================
// TELEGRAM WEBHOOK
// ============================================

app.post('/telegram', async (req, res) => {
  const message = req.body.message;
  if (!message) return res.sendOk();
  
  const chatId = message.chat.id;
  const text = message.text || '';
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  console.log(`Telegram: ${command} from ${chatId}`);
  
  let response = '';
  
  switch (command) {
    case '/start':
      response = `🏛️ *Tshwane Building Control*
      
Welcome! I can help you:
• Check zoning - /zoning ERF12345
• Check coverage - /coverage address
• Ask FAQ - /faq can i build a pool?
• File complaint - /complaint pothole on Main St

_Built for Tshwane Municipality_`;
      break;
      
    case '/zoning':
    case '/check':
      const erf = args || parts[1] || 'Unknown';
      const result = await callAPI('analyze', { erf, address: args });
      response = formatAnalysis(result);
      break;
      
    case '/faq':
      const faqResult = await callAPI('faq', { question: args });
      response = `❓ *${faqResult.question}*\n\n${faqResult.answer}`;
      break;
      
    case '/complaint':
      const triageResult = await callAPI('triage', { complaint: args });
      response = `✅ *Complaint Filed*\n\nReference: \`${triageResult.reference}\`\nDepartment: ${triageResult.category}\nPriority: ${triageResult.priority}`;
      break;
      
    case '/help':
      response = `Commands:
/zoning ERF12345 - Check property
/coverage Address - Check coverage
/faq question - Ask about building
/complaint issue - Report issue
/help - Show this message`;
      break;
      
    default:
      response = `Unknown command. Try /help for commands.`;
  }
  
  await sendTelegram(chatId, response);
  res.sendOk();
});

// ============================================
// WHATSAPP WEBHOOK
// ============================================

app.post('/whatsapp', async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  if (!message) return res.sendOk();
  
  const from = message.from;
  const text = message.text?.body || '';
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  console.log(`WhatsApp: ${command} from ${from}`);
  
  let response = '';
  
  switch (command) {
    case 'start':
    case 'hi':
    case 'hello':
      response = `🏛️ *Tshwane Building Control*

Welcome! I can help you:
• Check zoning - zoning ERF12345
• Check coverage - coverage address
• Ask FAQ - faq can i build a pool?
• File complaint - complaint pothole on Main St

_Built for Tshwane Municipality_`;
      break;
      
    case 'zoning':
    case 'check':
      const erf = args || 'Unknown';
      const result = await callAPI('analyze', { erf, address: args });
      response = formatAnalysis(result);
      break;
      
    case 'faq':
      const faqResult = await callAPI('faq', { question: args });
      response = `❓ ${faqResult.question}\n\n${faqResult.answer}`;
      break;
      
    case 'complaint':
      const triageResult = await callAPI('triage', { complaint: args });
      response = `Complaint Filed!\n\nRef: ${triageResult.reference}\nDept: ${triageResult.category}\nPriority: ${triageResult.priority}`;
      break;
      
    default:
      response = `Send "help" for commands.`;
  }
  
  await sendWhatsApp(from, response);
  res.sendOk();
});

// ============================================
// FORMAT HELPERS
// ============================================

function formatAnalysis(result) {
  if (result.error) {
    return `❌ Error: ${result.error}`;
  }
  
  let response = `🏛️ *Plan Analysis*\n\n`;
  response += `ERF: ${result.erf || 'N/A'}\n`;
  response += `Zone: ${result.zone || 'N/A'}\n`;
  response += `Coverage: ${result.coverage || 'N/A'}\n`;
  response += `Recommendation: ${result.recommendation || 'N/A'}\n\n`;
  
  if (result.compliance && result.compliance.length > 0) {
    response += `*Compliance Check:*\n`;
    result.compliance.forEach(c => {
      const icon = c.status === 'PASS' ? '✅' : '❌';
      response += `${icon} ${c.check}: ${c.value} / ${c.required}\n`;
    });
  }
  
  return response;
}

// ============================================
// HEALTH
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', bots: ['telegram', 'whatsapp'] });
});

// ============================================
// SERVER
// ============================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 Unified Bot running on port ${PORT}`);
  console.log(`   Telegram webhook: /telegram`);
  console.log(`   WhatsApp webhook: /whatsapp`);
});