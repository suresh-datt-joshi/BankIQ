const { auth } = require('../config/firebaseAdmin');

async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    const idToken = authHeader.substring(7);

    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error('Firebase authentication error:', error);

    return res.status(401).json({
      error: 'Invalid or expired authentication token.',
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.',
    });
  }

  if (req.user.admin !== true) {
    return res.status(403).json({
      error: 'Admin access required.',
    });
  }

  next();
}

module.exports = {
  verifyFirebaseToken,
  requireAdmin,
};
