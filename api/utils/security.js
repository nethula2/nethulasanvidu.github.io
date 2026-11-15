const crypto = require('crypto');

// ============================================================================
// OWASP Enterprise Security & Defense Utility Layer
// Built for Portfolio & Toolyard Architecture
// ============================================================================

// Secret for signing session tokens (HMAC-SHA256)
// Uses process.env.SESSION_SECRET or derives from admin credentials
const SESSION_SECRET = process.env.SESSION_SECRET || 
  process.env.CLOUDINARY_API_SECRET || 
  process.env.VAULT_PASSCODE || 
  '7f3b89a29e1c4d5f8e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e';

// Allowed CORS origins
const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https?:\/\/www\.nethulasanvidu\.works$/,
  /^https?:\/\/nethulasanvidu\.works$/,
  /^https:\/\/portfolio-.*-portfolio-nethula\.vercel\.app$/,
  /^https:\/\/portfolio-.*\.vercel\.app$/
];

// In-Memory Rate Limiting Engine with Auto-Pruning
const rateLimitStore = new Map();

// Periodic prune to prevent memory leaks (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();
}

/**
 * Extracts and sanitizes client IP address safely
 */
function getClientIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    if (ips.length > 0 && ips[0]) return ips[0].slice(0, 45);
  }
  return (req.headers['x-real-ip'] || 
          req.socket?.remoteAddress || 
          req.connection?.remoteAddress || 
          '127.0.0.1').slice(0, 45);
}

/**
 * Sliding Window Rate Limiter
 * @param {string} key Identifier (IP + action)
 * @param {number} maxAttempts Maximum allowed hits
 * @param {number} windowMs Window duration in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
function checkRateLimit(key, maxAttempts = 60, windowMs = 60000) {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000)
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxAttempts - record.count);
  const resetInSeconds = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds
  };
}

/**
 * Configure secure CORS headers based on trusted origin validation
 */
function handleCors(req, res) {
  const origin = req.headers.origin;

  // Check if origin matches trusted origins
  let isAllowed = false;
  if (origin) {
    isAllowed = ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
  }

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Vault-Key, X-Admin-Token, X-CSRF-Token'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache

  // Apply default security headers
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true; // Request handled
  }

  return false;
}

/**
 * Standard OWASP HTTP Security Headers
 */
function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

/**
 * Timing-safe string comparison to protect against timing side-channel attacks
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Secure Password Hashing using PBKDF2 (100,000 iterations, SHA-512)
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

/**
 * Verify password against PBKDF2 hash
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    // Legacy / plain-text fallback (constant time)
    return constantTimeCompare(password, storedHash);
  }

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHash = parts[3];

  const calculatedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return constantTimeCompare(calculatedHash, expectedHash);
}

/**
 * Generate cryptographically signed session token (HMAC-SHA256)
 */
function createSignedToken(payload, expiresInMs = 2 * 60 * 60 * 1000) {
  const data = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + expiresInMs,
    nonce: crypto.randomBytes(8).toString('hex')
  };

  const jsonStr = JSON.stringify(data);
  const b64Data = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(b64Data).digest('hex');
  return `${b64Data}.${signature}`;
}

/**
 * Verify cryptographically signed session token
 */
function verifySignedToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const b64Data = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);

  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(b64Data).digest('hex');
  if (!constantTimeCompare(signature, expectedSignature)) {
    return null; // Tampered or invalid signature
  }

  try {
    const jsonStr = Buffer.from(b64Data, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Verify if request possesses valid Admin authorization
 */
function requireAdminAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  const tokenHeader = req.headers['x-admin-token'] || '';

  let token = tokenHeader;
  if (!token && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // Also check admin session cookie if present
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/admin_session=([^;]+)/);
    if (match) token = match[1];
  }

  const payload = verifySignedToken(token);
  if (!payload || payload.role !== 'admin') {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ 
      error: 'Unauthorized: Administrative authentication required.' 
    }));
    return null;
  }

  return payload;
}

/**
 * HTML entity escaping for XSS prevention
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strict input sanitizer: strips non-printable control characters
 */
function sanitizeInput(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Safe error responder: logs internally, returns safe user-facing message
 */
function sendSafeError(res, statusCode, publicMessage, internalErr = null) {
  if (internalErr) {
    console.error(`[SEC_ALERT] ${new Date().toISOString()} | ${publicMessage}:`, internalErr.message || internalErr);
  }
  if (!res.writableEnded) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: publicMessage }));
  }
}

function resetRateLimit(key) {
  rateLimitStore.delete(key);
}

module.exports = {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  handleCors,
  applySecurityHeaders,
  constantTimeCompare,
  hashPassword,
  verifyPassword,
  createSignedToken,
  verifySignedToken,
  requireAdminAuth,
  escapeHtml,
  sanitizeInput,
  sendSafeError
};
