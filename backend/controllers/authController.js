// backend/controllers/authController.js
const User = require("../models/User");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

/**
 * @route   POST /api/auth/register
 * @desc    Registrar usuario
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "username, email y password son obligatorios.",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un usuario con ese email.",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un usuario con ese nombre de usuario.",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName: firstName || username,
      lastName: lastName || "",
    });

    const token = user.getSignedJwtToken();

    return res.status(201).json({
      success: true,
      token,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error("🔥 Error en register:", err);
    next(err);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y password son obligatorios.",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas.",
      });
    }

    const token = user.getSignedJwtToken();

    return res.status(200).json({
      success: true,
      token,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error("🔥 Error en login:", err);
    next(err);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Enviar enlace de reseteo de contraseña
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email es obligatorio.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message:
          "If this email is registered, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hora

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <p>You requested a password reset for your ArtCollab account.</p>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: "ArtCollab - Reset your password",
      html,
    });

    return res.json({
      success: true,
      message:
        "If this email is registered, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("🔥 Error en forgotPassword:", err);
    next(err);
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Aplicar nueva contraseña usando token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token y nueva contraseña son obligatorios.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token de reseteo inválido o expirado.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("🔥 Error en resetPassword:", err);
    next(err);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Perfil del usuario autenticado
 */
exports.getMe = async (req, res, next) => {
  try {
    // Asumiendo que tu middleware protect mete req.user.id
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error("🔥 Error en getMe:", err);
    next(err);
  }
};
