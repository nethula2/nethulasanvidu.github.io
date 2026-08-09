const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzdnarjczuwyyojopiiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZG5hcmpjenV3eXlvam9waWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM0ODEsImV4cCI6MjA5Nzk2OTQ4MX0.xqjKimgW8UwK2kSO4OMRZfRft0eJUMx7cIKza9jyzWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }
    const token = authHeader.split(' ')[1];

    // 2. Validate token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // 3. Extract and validate request body parameters
    const { rating, comment } = req.body;
    
    if (rating === undefined || comment === undefined) {
      return res.status(400).json({ error: 'Missing rating or comment' });
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const cleanComment = comment.trim();
    if (!cleanComment) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    if (cleanComment.length > 500) {
      return res.status(400).json({ error: 'Comment exceeds 500 characters limit' });
    }

    // 4. Save review to Supabase Database
    const name = user.user_metadata?.full_name || user.email || 'Anonymous Visitor';
    const avatarUrl = user.user_metadata?.avatar_url || '';

    const { data: insertData, error: dbError } = await supabase
      .from('reviews')
      .insert([
        {
          name: name,
          avatar_url: avatarUrl,
          rating: numericRating,
          comment: cleanComment,
          user_id: user.id
        }
      ])
      .select();

    if (dbError) {
      throw new Error(dbError.message);
    }

    return res.status(200).json({
      result: 'ok',
      review: insertData[0]
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ error: error.message });
  }
};
