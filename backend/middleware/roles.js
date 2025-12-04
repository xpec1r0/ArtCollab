// backend/middleware/roles.js

/**
 * Middleware para requerir uno o varios roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const userRole = req.user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

/**
 * Middleware para permitir:
 */
const requireSelfOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const userRole = req.user.role || "user";
    const userId = req.user._id.toString();
    const paramId = (req.params.id || req.params.userId || "").toString();

    if (userId === paramId) {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Insufficient permissions",
    });
  };
};

module.exports = {
  requireRole,
  requireSelfOrRole,
};
