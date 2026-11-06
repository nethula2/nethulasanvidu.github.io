module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-vault-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const configuredPasscode = process.env.VAULT_PASSCODE || 'NETHULA2026';
    const providedPasscode = (req.body && req.body.passcode) || 
                             req.headers['x-vault-key'] || 
                             (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (!providedPasscode) {
      return res.status(400).json({ error: 'Passcode is required' });
    }

    if (providedPasscode.trim() === configuredPasscode.trim()) {
      return res.status(200).json({ valid: true, message: 'Clearance granted' });
    } else {
      return res.status(401).json({ valid: false, error: 'Access Denied: Invalid clearance key' });
    }
  } catch (error) {
    console.error('Error verifying vault passcode:', error);
    return res.status(500).json({ error: 'Internal verification error' });
  }
};
