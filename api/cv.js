const fs = require('fs');
const path = require('path');
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

const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25MB

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // 1. GET: Fetch current CV config
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');

    try {
      const configPath = path.join(__dirname, '..', 'data', 'cv-config.json');
      let config = {
        filename: 'Nethula_Sanvidu_Portfolio_2026.pdf',
        localUrl: 'assets/uploaded_cv.pdf',
        downloadUrl: '/api/download-cv?action=download',
        viewUrl: '/api/download-cv?action=view',
        url: '/api/download-cv?action=download',
        sizeBytes: null,
        uploadedAt: null
      };

      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          const data = JSON.parse(content);
          config = { ...config, ...data };
        } catch (e) {}
      }

      config.downloadUrl = '/api/download-cv?action=download';
      config.viewUrl = '/api/download-cv?action=view';
      config.localUrl = 'assets/uploaded_cv.pdf';
      config.url = '/api/download-cv?action=download';

      return res.status(200).json({
        success: true,
        ...config
      });
    } catch (err) {
      return sendSafeError(res, 500, 'Unable to retrieve CV metadata', err);
    }
  }

  // 2. POST: Upload new CV (Admin Only)
  if (req.method === 'POST') {
    const admin = requireAdminAuth(req, res);
    if (!admin) return;

    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`admin-upload-cv:${clientIp}`, 10, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
      return sendSafeError(res, 429, 'Rate limit exceeded. Please wait before uploading again.');
    }

    try {
      const { filename, fileData } = req.body || {};

      if (!fileData || typeof fileData !== 'string') {
        return sendSafeError(res, 400, 'Invalid request: fileData (base64) is required');
      }

      const base64PrefixMatch = fileData.match(/^data:application\/pdf;base64,/i);
      const cleanBase64 = base64PrefixMatch ? fileData.slice(base64PrefixMatch[0].length) : fileData;
      const fileBuffer = Buffer.from(cleanBase64, 'base64');

      if (fileBuffer.length > MAX_PDF_SIZE) {
        return sendSafeError(res, 400, `File size exceeds the 25MB limit (Size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB).`);
      }

      if (fileBuffer.length < 50) {
        return sendSafeError(res, 400, 'Invalid or empty PDF file payload.');
      }

      const magic = fileBuffer.slice(0, 5).toString('utf-8');
      if (magic !== '%PDF-') {
        return sendSafeError(res, 400, 'Security rejection: Uploaded file is not a valid PDF document.');
      }

      let cleanFilename = sanitizeInput(filename || 'Nethula_Sanvidu_CV.pdf', 100);
      cleanFilename = cleanFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      if (!cleanFilename.toLowerCase().endsWith('.pdf')) {
        cleanFilename += '.pdf';
      }

      const assetsDir = path.join(__dirname, '..', 'assets');
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      const localTarget = path.join(assetsDir, 'uploaded_cv.pdf');
      fs.writeFileSync(localTarget, fileBuffer);

      try {
        const defaultPortfolioPath = path.join(assetsDir, 'Nethula_Sanvidu_Portfolio_2026.pdf');
        fs.writeFileSync(defaultPortfolioPath, fileBuffer);
      } catch (mirrorErr) {}

      let cloudUrl = null;
      try {
        const cloudResult = await cloudinary.uploader.upload(
          `data:application/pdf;base64,${cleanBase64}`,
          {
            resource_type: 'raw',
            folder: 'portfolio_cv',
            public_id: 'nethula_cv_active.pdf',
            overwrite: true
          }
        );
        cloudUrl = cloudResult.secure_url;
      } catch (cloudErr) {}

      const activeCvConfig = {
        filename: cleanFilename,
        localUrl: 'assets/uploaded_cv.pdf',
        cloudUrl: cloudUrl,
        downloadUrl: '/api/download-cv?action=download',
        viewUrl: '/api/download-cv?action=view',
        url: '/api/download-cv?action=download',
        sizeBytes: fileBuffer.length,
        uploadedAt: new Date().toISOString()
      };

      const configPath = path.join(dataDir, 'cv-config.json');
      fs.writeFileSync(configPath, JSON.stringify(activeCvConfig, null, 2), 'utf-8');

      console.log(`[SEC_AUDIT] New CV uploaded and activated: ${cleanFilename} (${fileBuffer.length} bytes) by admin IP ${clientIp}`);

      return res.status(200).json({
        success: true,
        message: 'CV uploaded and activated successfully.',
        cv: activeCvConfig
      });

    } catch (err) {
      return sendSafeError(res, 500, 'Failed to process CV upload.', err);
    }
  }

  return sendSafeError(res, 405, 'Method Not Allowed');
};
