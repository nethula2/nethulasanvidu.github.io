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
    const { public_id, title, description, url, display_url } = req.body;
    if (!public_id || !title) {
      return res.status(400).json({ error: 'Missing public_id or title' });
    }

    // 1. Add context metadata
    const contextResult = await cloudinary.uploader.add_context({
      title: title || '',
      description: description || '',
      url: url || '',
      display_url: display_url || ''
    }, [public_id]);

    // 2. Add tag 'web_project'
    const tagResult = await cloudinary.uploader.add_tag('web_project', [public_id]);

    return res.status(200).json({
      result: 'ok',
      context: contextResult,
      tag: tagResult
    });
  } catch (error) {
    console.error('Error saving web project:', error);
    return res.status(500).json({ error: error.message });
  }
};
