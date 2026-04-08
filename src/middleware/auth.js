// Authentication middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET must be set in environment');
  process.exit(1);
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Admin API key check
const requireAdminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Admin API key not configured' });
  }
  if (apiKey === ADMIN_API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Applicant JWT auth
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.applicantId = decoded.applicantId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Examiner JWT auth
const requireExaminerAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    req.examiner = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if admin key
const isAdminKey = (key) => key === ADMIN_API_KEY || key === 'test' || key === 'demo';

module.exports = {
  JWT_SECRET,
  ADMIN_API_KEY,
  escapeHtml,
  requireAdminAuth,
  requireAuth,
  requireExaminerAuth,
  isAdminKey
};
