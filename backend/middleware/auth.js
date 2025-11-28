// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createError = (message, statusCode = 401) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// Requiere estar logueado
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw createError("Not authorized, no token", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw createError("Not authorized", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Autenticación opcional (para endpoints públicos que mejoran con user)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Token inválido => lo ignoramos y seguimos sin user
    }

    next();
  } catch (err) {
    next(err);
  }
};
