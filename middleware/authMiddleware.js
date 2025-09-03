const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, role, tenantId? }

    // Only attach tenantId if it exists (super user won't have one)
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

function requireSuperUser(req, res, next) {
  try {
    if (!req.user || req.user.userType !== "super") {
      return res.status(403).json({ message: "Access denied. Super user only." });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}

function requireTenantAdmin(req, res, next) {
  try {
    if (!req.user || req.user.userType !== "admin") {
      return res.status(403).json({ message: "Access denied. Tenant admin only." });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { verifyToken, requireSuperUser, requireTenantAdmin };
