const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwcsjrhhl',
  api_key: process.env.CLOUDINARY_API_KEY || '447251912538258',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HJqfbkAHFK5M0Meb25dLAzWwC6s',
  secure: true
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const searchResult = await cloudinary.search
      .expression('resource_type:image AND tags:portfolio')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const resources = searchResult.resources || [];
    return res.status(200).json({ resources });
  } catch (error) {
    console.error('Error in get-portfolio API:', error);
    return res.status(500).json({ error: error.message });
  }
};
