// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getTokenFromRequest = (req) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies) {
    token =
      req.cookies.token || req.cookies.jwt || req.cookies.access_token || null;
  }

  return token;
};

/**
 * Middleware: require valid JWT
 */
const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, user not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({
      success: false,
      error: "Not authorized, invalid token",
    });
  }
};

/**
 * Middleware: optionalAuth
 */
const optionalAuth = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }

    return next();
  } catch (err) {
    console.warn("optionalAuth: invalid token ignored");
    return next();
  }
};

/**
 * Middleware: authorize
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, no user in request",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden, insufficient permissions",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
};
