const cloudinary = require('cloudinary').v2;
const {
  getClientIp,
  checkRateLimit,
  handleCors,
  requireAdminAuth,
  sanitizeInput,
  sendSafeError
} = require('./utils/security');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwcsjrhhl',
  api_key: process.env.CLOUDINARY_API_KEY || '447251912538258',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HJqfbkAHFK5M0Meb25dLAzWwC6s',
  secure: true
});

module.exports = async (req, res) => {
  // 1. Strict CORS & Preflight
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method Not Allowed');
  }

  // 2. Authentication & Authorization Enforcement (RBAC)
  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  // 3. Rate Limiting: Max 30 updates per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`admin-save-web:${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(res, 429, 'Rate limit exceeded. Please slow down.');
  }

  try {
    const { public_id, title, description, url, display_url } = req.body || {};

    const cleanPublicId = sanitizeInput(public_id, 255);
    const cleanTitle = sanitizeInput(title, 120);
    const cleanDescription = sanitizeInput(description, 500);
    const cleanUrl = sanitizeInput(url, 255);
    const cleanDisplayUrl = sanitizeInput(display_url, 120);

    if (!cleanPublicId || !cleanTitle) {
      return sendSafeError(res, 400, 'Missing required fields: public_id and title');
    }

    // 1. Add context metadata
    const contextResult = await cloudinary.uploader.add_context({
      title: cleanTitle,
      description: cleanDescription,
      url: cleanUrl,
      display_url: cleanDisplayUrl
    }, [cleanPublicId]);

    // 2. Add tag 'web_project'
    const tagResult = await cloudinary.uploader.add_tag('web_project', [cleanPublicId]);

    console.info(`[SEC_AUDIT] Web project saved: "${cleanTitle}" (${cleanPublicId}) by Admin from IP ${clientIp}`);

    return res.status(200).json({
      result: 'ok',
      context: contextResult,
      tag: tagResult
    });
  } catch (error) {
    return sendSafeError(res, 500, 'Failed to save web project', error);
  }
};
