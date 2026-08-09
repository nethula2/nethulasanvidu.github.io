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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Query Cloudinary for all resources tagged with 'web_project'
    // Include context fields
    const searchResult = await cloudinary.search
      .expression('tags:web_project')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    const resources = searchResult.resources || [];
    
    // Map resources to a clean structure
    const projects = resources.map(img => {
      const context = img.context || {};
      return {
        public_id: img.public_id,
        src: img.secure_url || img.url,
        format: img.format,
        version: img.version,
        title: context.title || 'Untitled Project',
        description: context.description || '',
        url: context.url || '#',
        display_url: context.display_url || ''
      };
    });

    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching web projects:', error);
    return res.status(500).json({ error: error.message });
  }
};
