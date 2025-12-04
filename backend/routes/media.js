const express = require("express");
const {
  getMedia,
  getMediaItem,
  createMedia,
  updateMedia,
  deleteMedia,
  toggleLike,
  addCollaborator,
  removeCollaborator,
  getCategories,
  uploadProjectCover,
  uploadProfileImage,
} = require("../controllers/mediaController");

const { protect, optionalAuth } = require("../middleware/auth");
const {
  validateMediaUpload,
  validateObjectId,
  validatePagination,
  validateSearch,
} = require("../middleware/validation");

const { uploadSingleMedia } = require("../middleware/upload");

const router = express.Router();

// Public routes
router.get("/", validatePagination, validateSearch, getMedia);
router.get("/categories", getCategories);
router.get("/:id", validateObjectId("id"), optionalAuth, getMediaItem);

// Covers de proyectos
router.post("/projects/cover", protect, uploadSingleMedia, uploadProjectCover);

// Media general
router.post("/", protect, uploadSingleMedia, validateMediaUpload, createMedia);

// Avatar / cover de perfil
router.post("/profile-image", protect, uploadSingleMedia, uploadProfileImage);

router.put("/:id", validateObjectId("id"), protect, updateMedia);
router.delete("/:id", validateObjectId("id"), protect, deleteMedia);
router.post("/:id/like", validateObjectId("id"), protect, toggleLike);

router.post(
  "/:id/collaborators",
  validateObjectId("id"),
  protect,
  addCollaborator
);

router.delete(
  "/:id/collaborators/:userId",
  validateObjectId("id"),
  validateObjectId("userId"),
  protect,
  removeCollaborator
);

module.exports = router;
