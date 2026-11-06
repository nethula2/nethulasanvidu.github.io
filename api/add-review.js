const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const PRIMARY_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'reviews-cache.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzdnarjczuwyyojopiiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    } catch (e) {
      console.warn('Could not persist review to', file, e.message);
    }
  });
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { rating, comment, name, role } = req.body || {};

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const cleanComment = (comment || '').toString().trim();
    if (!cleanComment) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    if (cleanComment.length > 500) {
      return res.status(400).json({ error: 'Comment exceeds 500 characters limit' });
    }

    let authorName = (name || '').toString().trim() || 'Verified Client';
    let authorRole = (role || '').toString().trim() || 'Client Transmission';
    let avatarUrl = '';
    let userId = 'guest-' + Date.now();

    // Check if client provided Supabase auth token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000));
        const authPromise = supabase.auth.getUser(token);
        const { data: { user }, error: authError } = await Promise.race([authPromise, timeoutPromise]);
        if (!authError && user) {
          authorName = user.user_metadata?.full_name || user.email || authorName;
          avatarUrl = user.user_metadata?.avatar_url || '';
          userId = user.id;
        }
      } catch (err) {
        // Supabase is paused or offline; continue in direct submission mode
      }
    }

    // Sanitize authorName and authorRole against HTML injection
    authorName = authorName.replace(/<[^>]*>/g, '').slice(0, 80);
    authorRole = authorRole.replace(/<[^>]*>/g, '').slice(0, 100);

    const newReview = {
      id: 'rev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: authorName,
      role: authorRole,
      avatar_url: avatarUrl,
      rating: numericRating,
      comment: cleanComment.replace(/<[^>]*>/g, ''),
      created_at: new Date().toISOString(),
      verified: true
    };

    // Try saving to Supabase DB in background (with short timeout)
    try {
      const dbPromise = supabase.from('reviews').insert([{
        name: newReview.name,
        avatar_url: newReview.avatar_url,
        rating: newReview.rating,
        comment: newReview.comment,
        user_id: userId
      }]).select();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000));
      const { data: dbData } = await Promise.race([dbPromise, timeoutPromise]);
      if (dbData && dbData[0]) {
        newReview.id = dbData[0].id;
      }
    } catch (dbErr) {
      // Supabase is paused; seamlessly keep local ID
    }

    // Always persist to local primary reviews store
    saveLocalReview(newReview);

    return res.status(200).json({
      result: 'ok',
      review: newReview
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ error: error.message });
  }
};
