const cloudinary = require('cloudinary').v2;
const {
  getClientIp,
  checkRateLimit,
  handleCors,
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

  if (req.method !== 'GET') {
    return sendSafeError(res, 405, 'Method Not Allowed');
  }

  // 2. Rate Limiting: Max 120 reads per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`port-read:${clientIp}`, 120, 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(res, 429, 'Rate limit exceeded');
  }

  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

  try {
    const searchResult = await cloudinary.search
      .expression('resource_type:image AND tags:portfolio')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const resources = searchResult.resources || [];
    return res.status(200).json({ resources });
  } catch (error) {
    return sendSafeError(res, 500, 'Error loading portfolio feed', error);
  }
};
