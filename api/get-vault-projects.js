const cloudinary = require('cloudinary').v2;
const {
  getClientIp,
  checkRateLimit,
  handleCors,
  constantTimeCompare,
  verifySignedToken,
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

  // 2. Rate Limiting: Max 60 requests per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`vault-read:${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(res, 429, 'Rate limit exceeded for vault archive.');
  }

  try {
    const configuredPasscode = process.env.VAULT_PASSCODE || 'NETHULA2026';
    const authHeader = req.headers.authorization || '';
    const customHeader = req.headers['x-vault-key'] || req.headers['x-admin-token'] || '';
    const queryKey = req.query ? (req.query.key || req.query.access) : '';

    const candidateTokenOrKey = (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
                                customHeader ||
                                queryKey ||
                                '';

    // 3. Robust Server-Side Authorization Verification (RBAC)
    let isAuthorized = false;

    // Check signed token first (admin or vault_guest)
    const payload = verifySignedToken(candidateTokenOrKey);
    if (payload && (payload.role === 'admin' || payload.role === 'vault_guest')) {
      isAuthorized = true;
    }

    // Check direct passcode match (timing-safe)
    if (!isAuthorized && candidateTokenOrKey) {
      if (constantTimeCompare(candidateTokenOrKey.trim(), configuredPasscode.trim())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.warn(`[SEC_AUDIT] Unauthorized access attempt to Vault projects from IP ${clientIp}`);
      return sendSafeError(res, 401, 'Unauthorized: Valid clearance key or active session is required.');
    }

    // 4. Query Cloudinary for confidential NDA assets
    const searchResult = await cloudinary.search
      .expression('tags:vault_project AND (resource_type:image OR resource_type:video)')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const resources = searchResult.resources || [];

    const projects = resources.map(item => {
      const context = item.context || {};
      const isVideo = item.resource_type === 'video';

      let coverSrc = item.secure_url || item.url;
      if (isVideo) {
        coverSrc = coverSrc.replace(/\.[^/.]+$/, '.jpg');
      }

      return {
        public_id: item.public_id,
        src: coverSrc,
        media_url: item.secure_url || item.url,
        format: item.format,
        version: item.version,
        title: context.title || 'RESTRICTED TRANSMISSION',
        client: context.client || 'CONFIDENTIAL CLIENT',
        description: context.description || 'Protected under non-disclosure agreement.',
        category: context.category || 'NDA WORK',
        url: context.url || '',
        resource_type: item.resource_type || 'image',
        created_at: item.created_at
      };
    });

    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return res.status(200).json(projects);
  } catch (error) {
    return sendSafeError(res, 500, 'Error fetching vault projects', error);
  }
};
