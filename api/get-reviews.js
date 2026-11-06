const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const PRIMARY_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'reviews-cache.json');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzdnarjczuwyyojopiiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Track if Supabase is unreachable/paused to prevent slow DNS/connection hangs
const STATUS_FILE = path.join(__dirname, '..', 'data', '.supabase_offline');
function isOfflineCached() { try { if (fs.existsSync(STATUS_FILE)) { const t = parseInt(fs.readFileSync(STATUS_FILE, 'utf8'), 10); if (Date.now() - t < OFFLINE_COOLDOWN_MS) return true; } } catch(e){} return false; }
function setOfflineCached() { try { fs.writeFileSync(STATUS_FILE, Date.now().toString(), 'utf8'); } catch(e){} }
const OFFLINE_COOLDOWN_MS = 60000; // 1 minute cooldown before retrying paused Supabase

function getLocalReviews() {
  const targetFile = fs.existsSync(PRIMARY_FILE) ? PRIMARY_FILE : (fs.existsSync(CACHE_FILE) ? CACHE_FILE : null);
  if (targetFile) {
    try {
      const cached = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch (e) {
      console.warn('Failed to read local reviews file:', e.message);
    }
  }
  return [];
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

  const now = Date.now();
  // If Supabase was detected offline recently, immediately serve local reviews (zero latency)
  if (isOfflineCached()) {
    return res.status(200).json(getLocalReviews());
  }

  try {
    // Race Supabase query against a 1200ms timeout
    const fetchPromise = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out (paused project)')), 1200)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      throw new Error(error.message);
    }

    if (data && Array.isArray(data) && data.length > 0) {
      try {
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
      } catch (cacheErr) {
        console.warn('Could not update reviews cache:', cacheErr.message);
      }
      return res.status(200).json(data);
    }

    // If Supabase returned empty table, fallback to local reviews
    return res.status(200).json(getLocalReviews());
  } catch (error) {
    setOfflineCached();
    // Return verified local client reviews immediately
    return res.status(200).json(getLocalReviews());
  }
};
