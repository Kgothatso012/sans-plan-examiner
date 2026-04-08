// Audit logging service
const { supabase } = require('../config/supabase');

async function logAudit(action, targetType, targetId, details = {}) {
  try {
    await supabase.from('audit_logs').insert({
      action,
      target_type: targetType,
      target_id: targetId,
      admin_email: 'admin@tshwane.gov.za',
      details
    });
  } catch (e) {
    // Non-fatal
  }
}

module.exports = { logAudit };
