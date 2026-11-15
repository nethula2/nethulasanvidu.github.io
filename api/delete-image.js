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
  if (!admin) return; // 401 response already sent by requireAdminAuth

  // 3. Rate Limiting: Max 60 deletions per minute per admin IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`admin-del:${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(res, 429, 'Rate limit exceeded for asset deletion. Please slow down.');
  }

  try {
    const { public_id, resource_type } = req.body || {};
    const sanitizedId = sanitizeInput(public_id, 255);

    if (!sanitizedId) {
      return sendSafeError(res, 400, 'Missing or invalid public_id');
    }

    // Restrict resource_type to valid Cloudinary asset types only
    const allowedTypes = ['image', 'video', 'raw'];
    const type = allowedTypes.includes(resource_type) ? resource_type : 'image';

    const result = await cloudinary.uploader.destroy(sanitizedId, { resource_type: type });

    console.info(`[SEC_AUDIT] Asset destroyed: "${sanitizedId}" (${type}) by Admin from IP ${clientIp}`);

    return res.status(200).json({
      result: result.result || 'ok',
      public_id: sanitizedId
    });
  } catch (error) {
    return sendSafeError(res, 500, 'Cloudinary asset deletion failed', error);
  }
};
