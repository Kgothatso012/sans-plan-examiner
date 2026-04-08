// Input validation middleware

// Sanitize string input
const sanitizeStr = (str, maxLen = 500) => {
  if (!str || typeof str !== 'string') return '';
  return str.slice(0, maxLen).replace(/[<>]/g, '');
};

// Validate email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Validate ERF number format
const isValidErf = (erf) => {
  if (!erf || typeof erf !== 'string') return false;
  return erf.trim().length > 0 && erf.length <= 50;
};

module.exports = {
  sanitizeStr,
  isValidEmail,
  isValidErf
};
