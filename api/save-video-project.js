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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { public_id, title, description, url, resource_type } = req.body;
    if (!public_id || !title) {
      return res.status(400).json({ error: 'Missing public_id or title' });
    }

    const type = resource_type || 'image';

    // 1. Add context metadata
    const contextResult = await cloudinary.uploader.add_context({
      title: title || '',
      description: description || '',
      url: url || ''
    }, [public_id], { resource_type: type });

    // 2. Add tag 'video_project'
    const tagResult = await cloudinary.uploader.add_tag('video_project', [public_id], { resource_type: type });

    return res.status(200).json({
      result: 'ok',
      context: contextResult,
      tag: tagResult
    });
  } catch (error) {
    console.error('Error saving video project:', error);
    return res.status(500).json({ error: error.message });
  }
};
