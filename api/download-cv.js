const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const {
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

  try {
    const action = req.query?.action || 'download';
    const disposition = action === 'view' ? 'inline' : 'attachment';

    // 1. Check Cloudinary first for active uploaded CV (.dat)
    try {
      const cloudResource = await cloudinary.api.resource(
        'portfolio_cv/nethula_cv_active.dat',
        { resource_type: 'raw', context: true }
      );

      if (cloudResource && cloudResource.secure_url) {
        const ctx = (cloudResource.context && cloudResource.context.custom) || cloudResource.context || {};
        const filename = ctx.filename || 'Nethula_Sanvidu_CV.pdf';

        const pdfFetch = await fetch(cloudResource.secure_url);
        if (pdfFetch.ok) {
          const arrayBuffer = await pdfFetch.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', buffer.length);
          res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
          res.setHeader('Cache-Control', 'public, max-age=60');
          return res.end(buffer);
        }
      }
    } catch (cloudErr) {
      // Fallback to local files if Cloudinary fetch fails
    }

    // 2. Fallback to local files
    const configPath = path.join(__dirname, '..', 'data', 'cv-config.json');
    let filename = 'Nethula_Sanvidu_Portfolio_2026.pdf';
    let localPath = path.join(__dirname, '..', 'assets', 'uploaded_cv.pdf');

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.filename) filename = config.filename;
      } catch (e) {}
    }

    if (!fs.existsSync(localPath)) {
      localPath = path.join(__dirname, '..', 'assets', 'Nethula_Sanvidu_Portfolio_2026.pdf');
    }

    if (!fs.existsSync(localPath)) {
      return sendSafeError(res, 404, 'CV document not found.');
    }

    const stat = fs.statSync(localPath);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=60');

    const readStream = fs.createReadStream(localPath);
    readStream.pipe(res);

  } catch (err) {
    return sendSafeError(res, 500, 'Unable to serve CV document.', err);
  }
};
