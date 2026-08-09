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
    // Query Cloudinary for all resources tagged with 'video_project'
    // Include both images and videos (since resource_type defaults to image-only)
    const searchResult = await cloudinary.search
      .expression('tags:video_project AND (resource_type:image OR resource_type:video)')
      .with_field('context')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    const resources = searchResult.resources || [];
    
    // Map resources to a clean structure
    const videos = resources.map(img => {
      const context = img.context || {};
      const isVideo = img.resource_type === 'video';
      
      // Auto-generate thumbnail URL from video or use image URL
      let coverSrc = img.secure_url || img.url;
      if (isVideo) {
        // Change file extension to jpg for video cover image
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
    console.error('Error fetching video projects:', error);
    return res.status(500).json({ error: error.message });
  }
};
