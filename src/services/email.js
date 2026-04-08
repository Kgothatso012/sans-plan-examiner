// Email notification service
const nodemailer = require('nodemailer');
const { escapeHtml } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || ''
  } : undefined
});

const PORT = process.env.PORT || 3000;

async function notifyApplicant(applicationId, type) {
  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('*, applicant_profiles(email)')
      .eq('id', applicationId)
      .single();

    if (appError || !app) return;

    const email = app.owner_email || app.applicant_profiles?.email;
    if (!email) return;

    const { reference, status } = app;
    const portalUrl = `http://localhost:${PORT}/client/track.html?ref=${reference}`;

    const subjects = {
      submitted: `Application ${reference} - Received`,
      status_changed: `Application ${reference} - Status Update`,
      comment_added: `Application ${reference} - New Comment`,
      revision_submitted: `Application ${reference} - Revision Received`
    };

    const styles = `body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:#fff}.header{background:linear-gradient(135deg,#49aa43 0%,#457c36 100%);color:#fff;padding:20px;text-align:center}.header h1{margin:0;font-size:24px}.content{padding:20px;color:#333}.status{display:inline-block;padding:8px 16px;border-radius:4px;font-weight:600;margin:10px 0}.status-submitted{background:#e3f2fd;color:#1565c0}.status-in_review{background:#fff3cd;color:#856404}.status-approved{background:#e8f5e9;color:#2e7d32}.status-rejected{background:#ffebee;color:#c62828}.status-revision{background:#fce4ec;color:#c2185b}.btn{display:inline-block;padding:12px 24px;background:#49aa43;color:#fff;text-decoration:none;border-radius:4px;margin:10px 0}.footer{background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#666}`;

    const templates = {
      submitted: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>Application Received</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your building plan application has been <strong>successfully received</strong>.</p><div class="status status-submitted">Reference: ${reference}</div><p>Track your application progress using the button below:</p><a href="${portalUrl}" class="btn">View Application</a><p style="margin-top:20px;font-size:14px;color:#666;">Or copy this link: ${portalUrl}</p></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,
      status_changed: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>Status Update</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your application <strong>${reference}</strong> status has been updated:</p><div class="status status-${status.toLowerCase()}">${status}</div><p>View full details and documents:</p><a href="${portalUrl}" class="btn">View Application</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,
      comment_added: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>New Comment Added</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>A new comment has been added to your application <strong>${reference}</strong>.</p><p>Please review the examiner's feedback:</p><a href="${portalUrl}" class="btn">View Comments</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,
      revision_submitted: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>Revision Required</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your application <strong>${reference}</strong> requires revisions.</p><p>Please review the comments and submit corrections:</p><a href="${portalUrl}" class="btn">View Revision Request</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`
    };

    const subject = subjects[type] || `Application ${reference} Update`;
    const html = templates[type] || `<p>Update for application ${reference}</p>`;
    const text = templates[type] ? `Update for application ${reference}. View at: ${portalUrl}` : `Update for application ${reference}`;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || '"Joe\'s Examiner" <noreply@tshwane.gov.za>',
      to: email,
      subject,
      text,
      html
    });
  } catch (err) {
    // Non-fatal - never throw
  }
}

module.exports = { notifyApplicant };
