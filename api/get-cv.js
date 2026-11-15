const fs = require('fs');
const path = require('path');
const {
  handleCors,
  sendSafeError
} = require('./utils/security');

module.exports = async (req, res) => {
  // 1. Strict CORS & Preflight
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendSafeError(res, 405, 'Method Not Allowed');
  }

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

    // Always route downloads and views through reliable first-party endpoint
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
};
