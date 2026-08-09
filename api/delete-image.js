const cloudinary = require('cloudinary').v2;

// Cloudinary SDK automatically configures itself if CLOUDINARY_URL is present.
// Otherwise, we fallback to manual credentials.
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: 'dwcsjrhhl',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

module.exports = async (req, res) => {
  // Enable CORS
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
    const { public_id, resource_type } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: 'Missing public_id' });
    }

    const type = resource_type || 'image';
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: type });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Cloudinary destruction failed:', error);
    return res.status(500).json({ error: error.message });
  }
};
