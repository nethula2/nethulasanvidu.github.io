const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const {
  getClientIp,
  checkRateLimit,
  handleCors,
  requireAdminAuth,
  sanitizeInput,
  escapeHtml,
  sendSafeError
} = require('./utils/security');

const PRIMARY_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'reviews-cache.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzdnarjczuwyyojopiiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getCachedReviews() {
  const targetFile = fs.existsSync(CACHE_FILE) ? CACHE_FILE : (fs.existsSync(PRIMARY_FILE) ? PRIMARY_FILE : null);
  if (targetFile) {
    try {
      const cached = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      if (Array.isArray(cached)) return cached;
    } catch (e) {}
  }
  return [];
}

const FAKE_NAMES = ['sarah jenkins', 'michael chen', 'kavindu perera', 'tharusha senanayake', 'dilan jayasuriya'];

function filterAndSanitize(reviews) {
  if (!Array.isArray(reviews)) return [];
  return reviews
    .filter(r => {
      if (!r || !r.name) return false;
      const nameLower = r.name.toLowerCase().trim();
      return !FAKE_NAMES.some(fake => nameLower.includes(fake));
    })
    .map(r => ({
      id: String(r.id || ''),
      name: escapeHtml(String(r.name || 'Verified Client')),
      role: escapeHtml(String(r.role || 'Client Transmission')),
      avatar_url: String(r.avatar_url || ''),
      rating: Math.max(1, Math.min(5, parseInt(r.rating, 10) || 5)),
      comment: escapeHtml(String(r.comment || '')),
      created_at: String(r.created_at || ''),
      verified: Boolean(r.verified)
    }));
}

function saveLocalReview(review) {
  [PRIMARY_FILE, CACHE_FILE].forEach(file => {
    try {
      let list = [];
      if (fs.existsSync(file)) {
        list = JSON.parse(fs.readFileSync(file, 'utf8'));
      }
      if (!Array.isArray(list)) list = [];
      list.unshift(review);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {}
  });
}

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
    } catch (e) {}
  });
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  // 1. GET: Fetch reviews
  if (req.method === 'GET') {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`rev-read:${clientIp}`, 120, 60 * 1000);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
      return sendSafeError(res, 429, 'Rate limit exceeded');
    }

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');

    try {
      const fetchPromise = supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timeout (paused project)')), 2500)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) throw new Error(error.message);

      if (data && Array.isArray(data)) {
        const cleanData = filterAndSanitize(data);
        try {
          fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cleanData, null, 2), 'utf8');
        } catch (cacheErr) {}
        return res.status(200).json(cleanData);
      }
      return res.status(200).json([]);
    } catch (error) {
      const cached = filterAndSanitize(getCachedReviews());
      return res.status(200).json(cached);
    }
  }

  // 2. DELETE (or POST with delete action / URL rewrite from /api/delete-review)
  const isDeleteAction = req.method === 'DELETE' || 
    (req.method === 'POST' && (
      (req.headers['x-matched-path'] && req.headers['x-matched-path'].includes('delete-review')) ||
      (req.url && req.url.includes('delete-review')) ||
      (req.body && (req.body.action === 'delete' || req.body._method === 'DELETE')) ||
      (req.query && (req.query.action === 'delete' || req.query.op === 'delete'))
    ));

  if (isDeleteAction) {
    const admin = requireAdminAuth(req, res);
    if (!admin) return;

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
      } catch (dbErr) {}

      deleteLocalReview(sanitizedId);
      console.info(`[SEC_AUDIT] Review deleted: "${sanitizedId}" by Admin from IP ${clientIp}`);

      return res.status(200).json({ result: 'ok', deletedId: sanitizedId });
    } catch (error) {
      return sendSafeError(res, 500, 'Error deleting review', error);
    }
  }

  // 3. POST: Add Review
  if (req.method === 'POST') {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`review-add:${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
      return sendSafeError(
        res, 
        429, 
        `Transmission rate limit reached. Please wait ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes before sending another review.`
      );
    }

    try {
      const { rating, comment, name, role } = req.body || {};
      const numRating = parseInt(rating, 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return sendSafeError(res, 400, 'Rating must be an integer between 1 and 5');
      }

      const cleanComment = sanitizeInput(comment, 600);
      if (!cleanComment || cleanComment.length < 5) {
        return sendSafeError(res, 400, 'Transmission message must contain at least 5 characters');
      }

      let authorName = sanitizeInput(name, 60) || 'Verified Client';
      let authorRole = sanitizeInput(role, 60) || 'Direct Transmission';

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            authorName = sanitizeInput(user.user_metadata?.full_name || user.email?.split('@')[0], 60) || authorName;
          }
        } catch (e) {}
      }

      const reviewId = 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const newReview = {
        id: reviewId,
        name: escapeHtml(authorName),
        role: escapeHtml(authorRole),
        rating: numRating,
        comment: escapeHtml(cleanComment),
        created_at: new Date().toISOString(),
        verified: true
      };

      try {
        const insertPromise = supabase.from('reviews').insert([newReview]).select();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        await Promise.race([insertPromise, timeoutPromise]);
      } catch (dbErr) {
        saveLocalReview(newReview);
      }

      return res.status(201).json({ result: 'ok', review: newReview });
    } catch (error) {
      return sendSafeError(res, 500, 'Error processing transmission', error);
    }
  }

  return sendSafeError(res, 405, 'Method Not Allowed');
};
