// middleware/tenantAuth.js
module.exports = function(req, res, next) {
  const tenantIdFromURL = req.params.tenantId;
  const tenantIdFromToken = req.user.tenantId; // e.g., from JWT

  if (tenantIdFromURL !== tenantIdFromToken) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};
