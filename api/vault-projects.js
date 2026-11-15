const cloudinary = require('cloudinary').v2;
const {
  getClientIp,
  checkRateLimit,
  handleCors,
  constantTimeCompare,
  verifySignedToken,
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
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
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

      let isAuthorized = false;
      const payload = verifySignedToken(candidateTokenOrKey);
      if (payload && (payload.role === 'admin' || payload.role === 'vault_guest')) {
        isAuthorized = true;
      }

      if (!isAuthorized && candidateTokenOrKey) {
        if (constantTimeCompare(candidateTokenOrKey.trim(), configuredPasscode.trim())) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        console.warn(`[SEC_AUDIT] Unauthorized access attempt to Vault projects from IP ${clientIp}`);
        return sendSafeError(res, 401, 'Unauthorized: Valid clearance key or active session is required.');
      }

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
  }

  if (req.method === 'POST') {
    const admin = requireAdminAuth(req, res);
    if (!admin) return;

    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`admin-save-vault:${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
      return sendSafeError(res, 429, 'Rate limit exceeded. Please slow down.');
    }

    try {
      const { public_id, title, client, description, category, url, resource_type } = req.body || {};
      const cleanPublicId = sanitizeInput(public_id, 255);
      const cleanTitle = sanitizeInput(title, 120);
      const cleanClient = sanitizeInput(client, 120);
      const cleanDescription = sanitizeInput(description, 500);
      const cleanCategory = sanitizeInput(category, 60);
      const cleanUrl = sanitizeInput(url, 255);

      if (!cleanPublicId || !cleanTitle) {
        return sendSafeError(res, 400, 'Missing required fields: public_id and title');
      }

      const type = (resource_type === 'video') ? 'video' : 'image';
      const contextResult = await cloudinary.uploader.add_context({
        title: cleanTitle,
        client: cleanClient || 'CONFIDENTIAL CLIENT',
        description: cleanDescription,
        category: cleanCategory || 'NDA WORK',
        url: cleanUrl
      }, [cleanPublicId], { resource_type: type });

      const tagResult = await cloudinary.uploader.add_tag('vault_project', [cleanPublicId], { resource_type: type });
      console.info(`[SEC_AUDIT] Vault project saved: "${cleanTitle}" (${cleanPublicId}) by Admin from IP ${clientIp}`);

      return res.status(200).json({
        result: 'ok',
        context: contextResult,
        tag: tagResult
      });
    } catch (error) {
      return sendSafeError(res, 500, 'Failed to save vault project', error);
    }
  }

  return sendSafeError(res, 405, 'Method Not Allowed');
};
