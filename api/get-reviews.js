const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const PRIMARY_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'reviews-cache.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzdnarjczuwyyojopiiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getCachedReviews() {
  const targetFile = fs.existsSync(CACHE_FILE) ? CACHE_FILE : (fs.existsSync(PRIMARY_FILE) ? PRIMARY_FILE : null);
  if (targetFile) {
    try {
      const cached = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      if (Array.isArray(cached)) {
        return cached;
      }
    } catch (e) {
      console.warn('Failed to read local reviews file:', e.message);
    }
  }
  return [];
}

const FAKE_NAMES = ['sarah jenkins', 'michael chen', 'kavindu perera', 'tharusha senanayake', 'dilan jayasuriya'];

function filterOutFake(reviews) {
  if (!Array.isArray(reviews)) return [];
  return reviews.filter(r => {
    if (!r || !r.name) return false;
    const nameLower = r.name.toLowerCase().trim();
    return !FAKE_NAMES.some(fake => nameLower.includes(fake));
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

  try {
    const fetchPromise = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timeout (paused project)')), 2500)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      throw new Error(error.message);
    }

    if (data && Array.isArray(data)) {
      const cleanData = filterOutFake(data);
      try {
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cleanData, null, 2), 'utf8');
      } catch (cacheErr) {}
      return res.status(200).json(cleanData);
    }

    return res.status(200).json([]);
  } catch (error) {
    console.warn('Supabase fetch failed (project may be paused):', error.message);
    // Never return fake reviews. Only return clean cached real reviews or empty array.
    const cached = filterOutFake(getCachedReviews());
    return res.status(200).json(cached);
  }
};
