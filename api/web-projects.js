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

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`web-read:${clientIp}`, 120, 60 * 1000);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
      return sendSafeError(res, 429, 'Rate limit exceeded');
    }

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    try {
      let resources = [];
      try {
        const tagResult = await cloudinary.api.resources_by_tag('web_project', {
          context: true,
          tags: true,
          max_results: 50
        });
        resources = tagResult.resources || [];
        resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } catch (tagErr) {
        const searchResult = await cloudinary.search
          .expression('tags:web_project')
          .with_field('context')
          .with_field('tags')
          .sort_by('created_at', 'desc')
          .max_results(50)
          .execute();
        resources = searchResult.resources || [];
      }

      const projects = resources.map(img => {
        const context = (img.context && img.context.custom) ? img.context.custom : (img.context || {});
        const isNoMockup = context.no_mockup === 'true' || (Array.isArray(img.tags) && img.tags.includes('no_mockup'));
        return {
          public_id: img.public_id,
          src: isNoMockup ? null : (img.secure_url || img.url),
          format: img.format,
          version: img.version,
          has_mockup: !isNoMockup,
          title: context.title || 'Untitled Project',
          description: context.description || '',
          url: context.url || '#',
          display_url: context.display_url || ''
        };
      });

      return res.status(200).json(projects);
    } catch (error) {
      return sendSafeError(res, 500, 'Error fetching web projects', error);
    }
  }

  if (req.method === 'POST') {
    const admin = requireAdminAuth(req, res);
    if (!admin) return;

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

      if (!cleanTitle) {
        return sendSafeError(res, 400, 'Missing required field: title');
      }

      let finalPublicId = cleanPublicId;
      let contextResult = null;
      let tagResult = null;

      if (finalPublicId) {
        // User provided a mockup image
        contextResult = await cloudinary.uploader.add_context({
          title: cleanTitle,
          description: cleanDescription,
          url: cleanUrl,
          display_url: cleanDisplayUrl,
          no_mockup: 'false'
        }, [finalPublicId]);

        tagResult = await cloudinary.uploader.add_tag('web_project', [finalPublicId]);
      } else {
        // Mockup image is optional to save storage.
        // Upload a 68-byte 1x1 transparent PNG placeholder that carries project metadata.
        const uploadRes = await cloudinary.uploader.upload(TRANSPARENT_PIXEL, {
          folder: 'portfolio_web',
          public_id: `nomockup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          tags: ['web_project', 'no_mockup'],
          context: {
            title: cleanTitle,
            description: cleanDescription,
            url: cleanUrl,
            display_url: cleanDisplayUrl,
            no_mockup: 'true'
          }
        });
        finalPublicId = uploadRes.public_id;
        contextResult = { status: 'created', public_id: finalPublicId };
        tagResult = { status: 'tagged', tags: ['web_project', 'no_mockup'] };
      }

      console.info(`[SEC_AUDIT] Web project saved: "${cleanTitle}" (${finalPublicId}) by Admin from IP ${clientIp}`);

      return res.status(200).json({
        result: 'ok',
        public_id: finalPublicId,
        context: contextResult,
        tag: tagResult
      });
    } catch (error) {
      return sendSafeError(res, 500, 'Failed to save web project', error);
    }
  }

  return sendSafeError(res, 405, 'Method Not Allowed');
};
