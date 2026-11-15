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

  try {
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
    const action = req.query?.action || 'download';
    const disposition = action === 'view' ? 'inline' : 'attachment';

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
