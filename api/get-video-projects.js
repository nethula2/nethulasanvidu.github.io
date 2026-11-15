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
  const rateLimit = checkRateLimit(`vid-read:${clientIp}`, 120, 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(res, 429, 'Rate limit exceeded');
  }

  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

  try {
    const searchResult = await cloudinary.search
      .expression('tags:video_project AND (resource_type:image OR resource_type:video)')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    const resources = searchResult.resources || [];
    
    const videos = resources.map(img => {
      const context = img.context || {};
      const isVideo = img.resource_type === 'video';
      
      let coverSrc = img.secure_url || img.url;
      if (isVideo) {
        coverSrc = coverSrc.replace(/\.[^/.]+$/, ".jpg");
      }

      return {
        public_id: img.public_id,
        src: coverSrc,
        format: img.format,
        version: img.version,
        title: context.title || 'Untitled Video',
        description: context.description || '',
        url: isVideo ? (img.secure_url || img.url) : (context.url || '#'),
        resource_type: img.resource_type || 'image'
      };
    });

    return res.status(200).json(videos);
  } catch (error) {
    return sendSafeError(res, 500, 'Error fetching video projects', error);
  }
};
