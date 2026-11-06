const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: 'dwcsjrhhl',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-vault-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const configuredPasscode = process.env.VAULT_PASSCODE || 'NETHULA2026';
    const authHeader = req.headers.authorization || '';
    const customHeader = req.headers['x-vault-key'] || '';
    const queryKey = req.query ? (req.query.key || req.query.access) : '';
    const isAdmin = (req.query && req.query.admin === 'true') || req.headers['x-admin-access'] === 'true';

    const providedPasscode = (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
                             customHeader ||
                             queryKey ||
                             '';

    // Verify clearance key or admin access
    if (!isAdmin && (!providedPasscode || providedPasscode.trim() !== configuredPasscode.trim())) {
      return res.status(401).json({ 
        error: 'Unauthorized: Valid clearance key is required to access the vault archive.' 
      });
    }

    // Query Cloudinary for all resources tagged with 'vault_project'
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

    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching vault projects:', error);
    return res.status(500).json({ error: error.message });
  }
};
