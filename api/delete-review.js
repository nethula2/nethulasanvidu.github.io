const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'Missing review id' });
    }

    try {
      const dbPromise = supabase.from('reviews').delete().eq('id', id).select();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000));
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (dbErr) {
      // Supabase paused; continue
    }

    deleteLocalReview(id);

    return res.status(200).json({
      result: 'ok',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: error.message });
  }
};
