const {
  getClientIp,
  checkRateLimit,
  handleCors,
  constantTimeCompare,
  createSignedToken,
  sendSafeError
} = require('./utils/security');

module.exports = async (req, res) => {
  // 1. Strict CORS & Preflight
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method Not Allowed');
  }

  // 2. Rate Limiting: Max 10 attempts per 10 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`vault-verify:${clientIp}`, 10, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.resetInSeconds));
    return sendSafeError(
      res, 
      429, 
      `Too many failed attempts. Vault locked for security. Please retry in ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes.`
    );
  }

  try {
    const configuredPasscode = process.env.VAULT_PASSCODE || 'NETHULA2026';
    const providedPasscode = (req.body && req.body.passcode) || 
                             req.headers['x-vault-key'] || 
                             (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ''));

    if (!providedPasscode || typeof providedPasscode !== 'string') {
      return sendSafeError(res, 400, 'Passcode is required');
    }

    // 3. Timing-Safe Passcode Comparison
    const isValid = constantTimeCompare(providedPasscode.trim(), configuredPasscode.trim());

    if (isValid) {
      // Generate signed, tamper-proof vault session token (valid for 12 hours)
      const vaultToken = createSignedToken({ role: 'vault_guest', ip: clientIp }, 12 * 60 * 60 * 1000);

      console.info(`[SEC_AUDIT] Vault access clearance granted for IP ${clientIp}`);

      return res.status(200).json({
        valid: true,
        token: vaultToken,
        message: 'Clearance verified. Vault session established.'
      });
    } else {
      console.warn(`[SEC_AUDIT] Failed vault clearance attempt from IP ${clientIp}`);
      return sendSafeError(res, 401, 'Access Denied: Invalid clearance key');
    }
  } catch (error) {
    return sendSafeError(res, 500, 'Internal verification error', error);
  }
};
