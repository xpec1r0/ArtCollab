// backend/routes/projects.js
const express = require("express");
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleLike,
  inviteUser,
  joinProject,
  leaveProject,
  addMedia,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require("../controllers/projectController");

const { protect, optionalAuth } = require("../middleware/auth");
const {
  validateProjectCreation,
  validateObjectId,
  validatePagination,
  validateSearch,
} = require("../middleware/validation");

const router = express.Router();

// 🔓 Public / semi-public (GitHub-style)
router.get("/", validatePagination, validateSearch, optionalAuth, getProjects);
router.get("/:id", validateObjectId("id"), optionalAuth, getProject);

// 🔒 Project CRUD
router.post("/", protect, validateProjectCreation, createProject);
router.put("/:id", validateObjectId("id"), protect, updateProject);
router.delete("/:id", validateObjectId("id"), protect, deleteProject);

// 🔒 Likes
router.post("/:id/like", validateObjectId("id"), protect, toggleLike);

router.post("/:id/invite", validateObjectId("id"), protect, inviteUser);
router.post("/:id/join", validateObjectId("id"), protect, joinProject);
router.post("/:id/leave", validateObjectId("id"), protect, leaveProject);

router.post("/:id/media", validateObjectId("id"), protect, addMedia);

// 🔒 Milestones / timeline
router.post(
  "/:id/milestones",
  validateObjectId("id"),
  protect,
  createMilestone
);
router.patch(
  "/:id/milestones/:milestoneId",
  validateObjectId("id"),
  validateObjectId("milestoneId"),
  protect,
  updateMilestone
);
router.delete(
  "/:id/milestones/:milestoneId",
  validateObjectId("id"),
  validateObjectId("milestoneId"),
  protect,
  deleteMilestone
);

module.exports = router;
