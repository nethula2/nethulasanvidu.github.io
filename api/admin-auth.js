const {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  handleCors,
  verifyPassword,
  createSignedToken,
  verifySignedToken,
  sendSafeError
} = require('./utils/security');

// Master admin credential
// Supports ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, or default 'portfolio2026'
const DEFAULT_ADMIN_PASS = 'portfolio2026';
const CONFIGURED_ADMIN_PASS = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;
const CONFIGURED_ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || null;

module.exports = async (req, res) => {
  // 1. Strict CORS & Preflight
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method Not Allowed');
  }

  const clientIp = getClientIp(req);
  const { action, password, token } = req.body || {};

  // --------------------------------------------------------------------------
  // ACTION: VERIFY (Check existing session)
  // --------------------------------------------------------------------------
  if (action === 'verify') {
    let candidateToken = token;
    if (!candidateToken && req.headers.authorization?.startsWith('Bearer ')) {
      candidateToken = req.headers.authorization.slice(7).trim();
    }
    if (!candidateToken && req.headers.cookie) {
      const match = req.headers.cookie.match(/admin_session=([^;]+)/);
      if (match) candidateToken = match[1];
    }

    const payload = verifySignedToken(candidateToken);
    if (payload && payload.role === 'admin') {
      return res.status(200).json({ authenticated: true, exp: payload.exp, role: payload.role });
    }
    return res.status(401).json({ authenticated: false });
  }

  // --------------------------------------------------------------------------
  // ACTION: LOGOUT
  // --------------------------------------------------------------------------
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return res.status(200).json({ success: true, message: 'Console locked' });
  }

  // --------------------------------------------------------------------------
  // ACTION: LOGIN (Brute-force protected)
  // --------------------------------------------------------------------------
  const isLocalIp = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';
  const maxAttempts = isLocalIp ? 50 : 10;
  const rateLimitKey = `admin-login:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, maxAttempts, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(
      res, 
      429, 
      `Too many failed attempts. Console locked for security. Try again in ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes.`
    );
  }

  if (!password || typeof password !== 'string') {
    return sendSafeError(res, 400, 'Password is required');
  }

  // Verify password using timing-safe comparison / PBKDF2
  let isValid = false;
  if (CONFIGURED_ADMIN_HASH) {
    isValid = verifyPassword(password, CONFIGURED_ADMIN_HASH);
  } else {
    isValid = verifyPassword(password, CONFIGURED_ADMIN_PASS);
    // Also accept vault passcode as fallback if defined
    if (!isValid && process.env.VAULT_PASSCODE) {
      isValid = verifyPassword(password, process.env.VAULT_PASSCODE);
    }
  }

  if (!isValid) {
    console.warn(`[SEC_AUDIT] Failed admin login attempt from IP: ${clientIp} at ${new Date().toISOString()}`);
    return sendSafeError(res, 401, 'Incorrect decryption password. Access denied.');
  }

  // Login successful: reset rate limiter for this IP
  resetRateLimit(rateLimitKey);
  // Generate signed admin session token (valid for 2 hours)
  const sessionToken = createSignedToken({ role: 'admin', ip: clientIp }, 2 * 60 * 60 * 1000);

  // Set secure HTTP-only cookie with SameSite protection
  const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader(
    'Set-Cookie',
    `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200${isSecure ? '; Secure' : ''}`
  );

  console.info(`[SEC_AUDIT] Successful admin authentication from IP: ${clientIp} at ${new Date().toISOString()}`);

  return res.status(200).json({
    success: true,
    token: sessionToken,
    expiresIn: 7200,
    message: 'Decryption verified. Console access granted.'
  });
};
