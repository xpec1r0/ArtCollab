// backend/routes/userRoutes.js
const express = require('express');
const {
  getUsers,
  getUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  changePassword,
  deactivateAccount,
  getUserMedia,
  getUserProjects,
  toggleFollow,
  getUserStats
} = require('../controllers/userController');

const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

/**
 * RUTAS DEL USUARIO ACTUAL (/me)
 * (Estas SIEMPRE antes de /:id)
 */
router.get('/me', protect, getCurrentUserProfile);
router.patch('/me/profile', protect, updateCurrentUserProfile);
router.patch('/me/password', protect, changePassword);
router.delete('/me', protect, deactivateAccount);

/**
 * RUTAS PÚBLICAS / POR ID
 */
router.get('/', validatePagination, validateSearch, getUsers);

// getUser necesita saber quién es el viewer → optionalAuth
router.get('/:id', optionalAuth, validateObjectId('id'), getUser);

router.get(
  '/:id/media',
  validateObjectId('id'),
  validatePagination,
  validateSearch,
  optionalAuth,
  getUserMedia
);

router.get(
  '/:id/projects',
  validateObjectId('id'),
  validatePagination,
  validateSearch,
  optionalAuth,
  getUserProjects
);

router.get('/:id/stats', validateObjectId('id'), getUserStats);

/**
 * RUTAS PROTEGIDAS POR ID
 */
router.post('/:id/follow', validateObjectId('id'), protect, toggleFollow);

module.exports = router;
