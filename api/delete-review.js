const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {
  getClientIp,
  checkRateLimit,
  handleCors,
  requireAdminAuth,
  sanitizeInput,
  sendSafeError
} = require('./utils/security');

const PRIMARY_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'reviews-cache.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzdnarjczuwyyojopiiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function deleteLocalReview(id) {
  [PRIMARY_FILE, CACHE_FILE].forEach(file => {
    try {
      if (fs.existsSync(file)) {
        let list = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Array.isArray(list)) {
          list = list.filter(r => r.id !== id);
          fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.warn('Could not delete review from', file, e.message);
    }
  });
}

module.exports = async (req, res) => {
  // 1. Strict CORS & Preflight
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method Not Allowed');
  }

  // 2. Authentication & Authorization Enforcement (RBAC)
  const admin = requireAdminAuth(req, res);
  if (!admin) return;

  // 3. Rate Limiting: Max 60 review deletions per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`admin-del-rev:${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(res, 429, 'Rate limit exceeded. Please slow down.');
  }

  try {
    const { id } = req.body || {};
    const sanitizedId = sanitizeInput(id, 100);

    if (!sanitizedId) {
      return sendSafeError(res, 400, 'Missing or invalid review id');
    }

    try {
      const dbPromise = supabase.from('reviews').delete().eq('id', sanitizedId).select();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (dbErr) {
      // Supabase is offline; continue with local deletion
    }

    deleteLocalReview(sanitizedId);

    console.info(`[SEC_AUDIT] Review deleted: "${sanitizedId}" by Admin from IP ${clientIp}`);

    return res.status(200).json({
      result: 'ok',
      deletedId: sanitizedId
    });
  } catch (error) {
    return sendSafeError(res, 500, 'Error deleting review', error);
  }
};
