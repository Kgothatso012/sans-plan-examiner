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

const deptNames = {
  'BC': 'Building Control',
  'RSP': 'Regional Spatial Planning',
  'FS': 'Fire Safety',
  'GEO': 'Geology',
  'MH': 'Municipal Health',
  'TI': 'Traffic Impact',
  'RSW': 'Roads and Storm Water',
  'WS': 'Water and Sanitation',
  'WM': 'Waste Management',
  'EPO': 'Environmental Planning & Open Space',
  'WP': 'Water Pollution',
  'TRES': 'Treasury'
};

const stageNames = {
  'RECEIVED': 'Application Received',
  'ACKNOWLEDGED': 'Application Acknowledged',
  'UNDER_REVIEW': 'Under Review by Departments',
  'DECISION': 'Decision Made',
  'COLLECTION': 'Ready for Collection'
};

async function notifyApplicant(applicationId, type, extraData = {}) {
  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('*, applicant_profiles(email)')
      .eq('id', applicationId)
      .single();

    if (appError || !app) return;

    const email = app.owner_email || app.applicant_profiles?.email;
    if (!email) return;

    const { reference, status, workflow_stage, departments } = app;
    const portalUrl = `http://localhost:${PORT}/client/track.html?ref=${reference}`;

    const styles = `body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f5f5f5}.container{max-width:600px;margin:0 auto;background:#fff}.header{background:linear-gradient(135deg,#1a4b8c 0%,#2d7d46 100%);color:#fff;padding:20px;text-align:center}.header h1{margin:0;font-size:24px}.header p{margin:5px 0 0;font-size:14px;opacity:0.9}.content{padding:20px;color:#333}.status{display:inline-block;padding:8px 16px;border-radius:4px;font-weight:600;margin:10px 0}.status-received{background:#e8f5e9;color:#1b5e20}.status-acknowledged{background:#e3f2fd;color:#0d47a1}.status-under_review{background:#fff8e6;color:#8a6000}.status-approved{background:#e8f5e9;color:#2e7d32}.status-rejected{background:#ffebee;color:#c62828}.status-collection{background:#f3e5f5;color:#7b1fa2}.btn{display:inline-block;padding:12px 24px;background:#1a4b8c;color:#fff;text-decoration:none;border-radius:4px;margin:10px 0}.btn-green{background:#2d7d46}.footer{background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#666}.dept-list{margin:10px 0;padding:10px;background:#f8f9fa;border-radius:4px}.dept-item{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee}.dept-item:last-child{border-bottom:none}.critical-note{background:#ffebee;border:1px solid #ef5350;padding:12px;border-radius:4px;margin:10px 0}.ai-summary{background:#f8f9fa;padding:15px;border-radius:4px;margin:10px 0}.ai-stat{display:inline-block;text-align:center;padding:10px 15px;margin:5px;background:#fff;border-radius:4px;min-width:80px}.ai-stat-number{font-size:24px;font-weight:700}.ai-stat-label{font-size:11px;color:#666;text-transform:uppercase}`;

    // Build department status list for email
    let deptStatusHtml = '';
    if (departments && Array.isArray(departments)) {
      deptStatusHtml = '<div class="dept-list"><strong>Departments:</strong>';
      departments.forEach(d => {
        const statusColor = d.status === 'APPROVED' ? '#2e7d32' : d.status === 'REJECTED' ? '#c62828' : '#8a6000';
        deptStatusHtml += `<div class="dept-item"><span>${deptNames[d.code] || d.code}</span><span style="color:${statusColor};font-weight:600">${d.status}</span></div>`;
      });
      deptStatusHtml += '</div>';
    }

    const subjects = {
      submitted: `Application ${reference} - Received`,
      stage_changed: `Application ${reference} - ${stageNames[workflow_stage] || 'Stage Update'}`,
      department_completed: `Application ${reference} - Department Review Complete`,
      decision: `Application ${reference} - ${status === 'APPROVED' ? 'Approved!' : status === 'REJECTED' ? 'Not Approved' : 'Decision Made'}`,
      collection: `Application ${reference} - Ready for Collection`,
      ai_complete: `Application ${reference} - AI Analysis Complete`,
      comment_added: `Application ${reference} - New Comment`
    };

    const templates = {
      submitted: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>Application Received</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your building plan application has been <strong>successfully received</strong>.</p><div class="status status-received">Reference: ${reference}</div><p><strong>Next Steps:</strong></p><ul><li>Your application will be acknowledged within 2 working days</li><li>It will then be routed to relevant departments for review</li><li>You will receive notifications as it progresses</li></ul><a href="${portalUrl}" class="btn">Track Application</a><p style="margin-top:20px;font-size:14px;color:#666;">Or copy this link: ${portalUrl}</p></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,

      stage_changed: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>${stageNames[workflow_stage] || 'Status Update'}</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your application <strong>${reference}</strong> has moved to the next stage:</p><div class="status status-${(workflow_stage || status).toLowerCase()}">${stageNames[workflow_stage] || status}</div>${deptStatusHtml}<p>Track your application progress:</p><a href="${portalUrl}" class="btn">View Application</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,

      department_completed: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>Department Review Complete</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>One of the departments reviewing your application <strong>${reference}</strong> has completed their review.</p>${deptStatusHtml}<p>Your application is still being processed by other departments. You will be notified when the final decision is made.</p><a href="${portalUrl}" class="btn">Track Application</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,

      decision: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>${status === 'APPROVED' ? 'Congratulations! Application Approved' : 'Application Decision'}</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your application <strong>${reference}</strong> has been:</p><div class="status status-${status.toLowerCase()}">${status === 'APPROVED' ? 'APPROVED' : 'REJECTED'}</div>${deptStatusHtml}${status === 'APPROVED' ? '<p>Your building plan has been approved! You may now proceed with construction.</p>' : '<p>If you believe this decision was made in error, you may appeal within 30 days.</p>'}<a href="${portalUrl}" class="btn ${status === 'APPROVED' ? 'btn-green' : ''}">View Decision Details</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,

      collection: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>Ready for Collection</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your application <strong>${reference}</strong> is now ready for collection.</p><div class="status status-collection">COLLECTION</div><p><strong>To collect your approved plans:</strong></p><ul><li>Visit the Building Control Division counter</li><li>Bring your ID and this reference number</li><li>Collect between 7:30 - 16:30, Monday to Friday</li></ul><a href="${portalUrl}" class="btn btn-green">View Collection Details</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,

      ai_complete: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>AI Compliance Analysis Complete</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>Your application <strong>${reference}</strong> has been automatically reviewed for SANS 10400 compliance.</p><div class="ai-summary"><strong>AI Analysis Summary:</strong><br><div style="margin-top:10px"><span class="ai-stat"><span class="ai-stat-number" style="color:#2e7d32">${extraData.passCount || 0}</span><br><span class="ai-stat-label">Passed</span></span><span class="ai-stat"><span class="ai-stat-number" style="color:#ef5350">${extraData.failCount || 0}</span><br><span class="ai-stat-label">Failed</span></span><span class="ai-stat"><span class="ai-stat-number" style="color:#ff9800">${extraData.warningCount || 0}</span><br><span class="ai-stat-label">Warnings</span></span></div></div>${(extraData.criticalCount || 0) > 0 ? '<div class="critical-note"><strong>Note:</strong> ' + extraData.criticalCount + ' critical issue(s) found that require(s) attention before final approval.</div>' : ''}<p>This AI analysis is preliminary. A dedicated examiner will review and provide the final decision.</p><a href="${portalUrl}" class="btn">View Full Analysis</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`,

      comment_added: `<!DOCTYPE html><html><head><style>${styles}</style></head><body><div class="container"><div class="header"><h1>Tshwane Municipality</h1><p>Building Control Division</p></div><div class="content"><h2>New Comment Added</h2><p>Dear ${escapeHtml(app.owner_name) || 'Applicant'},</p><p>A new comment has been added to your application <strong>${reference}</strong>.</p><p>Please review the examiner's feedback:</p><a href="${portalUrl}" class="btn">View Comments</a></div><div class="footer"><p>Tshwane Municipality Building Control<br>Email: building@tshwane.gov.za | Tel: 012 358 0000</p></div></div></body></html>`
    };

    const subject = subjects[type] || `Application ${reference} Update`;
    const html = templates[type] || `<p>Update for application ${reference}</p>`;
    const text = templates[type] ? `Update for application ${reference}. View at: ${portalUrl}` : `Update for application ${reference}`;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || '"Tshwane Building Control" <noreply@tshwane.gov.za>',
      to: email,
      subject,
      text,
      html
    });
  } catch (err) {
    // Non-fatal - never throw
  }
}

// Send notification when department completes review
async function notifyDepartmentComplete(applicationId, departmentCode) {
  await notifyApplicant(applicationId, 'department_completed', { completedDept: departmentCode });
}

// Send notification when AI analysis completes
async function notifyAIComplete(applicationId, analysisResults) {
  const passCount = analysisResults.filter(r => r.status === 'PASS').length;
  const failCount = analysisResults.filter(r => r.status === 'FAIL').length;
  const warningCount = analysisResults.filter(r => r.status === 'WARNING').length;
  const criticalCount = analysisResults.filter(r => r.severity === 'CRITICAL').length;

  await notifyApplicant(applicationId, 'ai_complete', { passCount, failCount, warningCount, criticalCount });
}

module.exports = { notifyApplicant, notifyDepartmentComplete, notifyAIComplete };
