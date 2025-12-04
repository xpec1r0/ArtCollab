// backend/controllers/projectController.js
const Project = require("../models/Project");
const User = require("../models/User");
const Media = require("../models/Media");
const mongoose = require("mongoose");

/**
 * GET /api/projects
 */
const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    const q = req.query.q || "";
    const category = req.query.category;
    const projectType = req.query.projectType;
    const status = req.query.status;
    const featured = req.query.featured === "true";
    const tagsQuery = req.query.tags;
    const visibilityFilter = req.query.visibility;
    const ownerFilterRaw = req.query.owner;

    // sort
    const sortParam = req.query.sort || "-createdAt";
    const sortField = sortParam.startsWith("-")
      ? sortParam.slice(1)
      : sortParam;
    const sortOrder = sortParam.startsWith("-") ? -1 : 1;
    const sortBy = { [sortField]: sortOrder };

    const baseFilter = {};

    if (q) {
      const searchRegex = new RegExp(q, "i");
      baseFilter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [q.toLowerCase()] } },
      ];
    }

    if (category) {
      baseFilter.category = category;
    }

    if (projectType) {
      baseFilter.projectType = projectType;
    }

    if (status) {
      baseFilter.status = status;
    }

    if (featured) {
      baseFilter.isFeatured = true;
    }

    if (tagsQuery) {
      const tags = tagsQuery
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (tags.length > 0) {
        baseFilter.tags = { $in: tags };
      }
    }

    if (visibilityFilter) {
      baseFilter.visibility = visibilityFilter;
    }

    // ==========================
    //  LÓGICA DE OWNER / VISIBILIDAD
    // ==========================
    let query;

    // Normalizamos ownerFilter (aceptamos "me" o un ObjectId válido)
    let ownerId = null;
    if (ownerFilterRaw) {
      if (ownerFilterRaw === "me" && req.user) {
        ownerId = req.user._id;
      } else if (mongoose.Types.ObjectId.isValid(ownerFilterRaw)) {
        // dejamos que Mongoose castee el string; no usamos new ObjectId()
        ownerId = ownerFilterRaw;
      }
    }

    if (ownerId) {
      query = {
        ...baseFilter,
        owner: ownerId,
      };
    } else if (!req.user) {
      query = {
        ...baseFilter,
        visibility: "public",
      };
    } else {
      const userId = req.user._id;

      const common = baseFilter;

      query = {
        $or: [
          {
            ...common,
            visibility: "public",
          },
          {
            ...common,
            owner: userId,
          },
          {
            ...common,
            "participants.user": userId,
            "participants.status": "active",
          },
        ],
      };
    }

    const projects = await Project.find(query)
      .populate("owner", "firstName lastName username profilePicture")
      .populate(
        "participants.user",
        "firstName lastName username profilePicture"
      )
      .sort(sortBy)
      .limit(limit)
      .skip(startIndex);

    const total = await Project.countDocuments(query);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProjects: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: projects.length,
      pagination,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public/Private (depends on visibility)
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "firstName lastName username profilePicture bio")
      .populate(
        "participants.user",
        "firstName lastName username profilePicture"
      )
      .populate("participants.invitedBy", "firstName lastName username")
      .populate(
        "media.mediaItem",
        "title cloudUrl thumbnailUrl mediaType category"
      )
      .populate("media.addedBy", "firstName lastName username")
      .populate("likes.user", "firstName lastName username");

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const user = req.user || null;
    const userId = user ? user._id : null;

    if (!project.canView(userId)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this project",
      });
    }

    await project.incrementViews(userId);

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      projectType,
      visibility,
      tags,
      deadline,
      settings,
      startDate,
      endDate,
    } = req.body;

    const project = await Project.create({
      title,
      description,
      category,
      projectType,
      owner: req.user._id,
      visibility: visibility || "participants_only",
      tags: tags || [],
      deadline: deadline || null,
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      settings: settings || {},
    });

    await project.populate(
      "owner",
      "firstName lastName username profilePicture"
    );
    await project.populate(
      "participants.user",
      "firstName lastName username profilePicture"
    );

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to edit this project",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "projectType",
      "visibility",
      "tags",
      "deadline",
      "status",
      "settings",
      "startDate",
      "endDate",
      "isFeatured",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "firstName lastName username profilePicture")
      .populate(
        "participants.user",
        "firstName lastName username profilePicture"
      );

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owner o admin/support)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isModerator = ["admin", "support"].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this project",
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Like/Unlike project
// @route   POST /api/projects/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this project",
      });
    }

    const existingLike = project.likes.find(
      (like) => like.user.toString() === req.user._id.toString()
    );

    let action;
    if (existingLike) {
      await project.removeLike(req.user._id);
      action = "unliked";
    } else {
      await project.addLike(req.user._id);
      action = "liked";
    }

    const updatedProject = await Project.findById(req.params.id).populate(
      "owner",
      "firstName lastName username"
    );

    res.status(200).json({
      success: true,
      action,
      likeCount: updatedProject.likeCount,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Invite user to project
// @route   POST /api/projects/:id/invite
// @access  Private (owner o participante con canInvite)
const inviteUser = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canInvite(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to invite users to this project",
      });
    }

    if (project.hasReachedMaxParticipants()) {
      return res.status(400).json({
        success: false,
        error: "Max participants limit reached",
      });
    }

    const invitedUser = await User.findById(userId);
    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await project.addParticipant(userId, role || "contributor", req.user._id);
    await project.populate(
      "participants.user",
      "firstName lastName username profilePicture"
    );

    res.status(200).json({
      success: true,
      message: "User invited successfully",
      project,
    });
  } catch (error) {
    console.error("Invite user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Join project (accept invitation)
// @route   POST /api/projects/:id/join
// @access  Private
const joinProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const participant = project.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        error: "No invitation found for this project",
      });
    }

    if (participant.status === "active") {
      return res.status(400).json({
        success: false,
        error: "Already a member of this project",
      });
    }

    if (participant.status !== "invited") {
      return res.status(400).json({
        success: false,
        error: "Invalid invitation status",
      });
    }

    if (project.hasReachedMaxParticipants()) {
      return res.status(400).json({
        success: false,
        error: "Max participants limit reached",
      });
    }

    participant.status = "active";
    participant.joinedAt = new Date();

    await project.save();

    res.status(200).json({
      success: true,
      message: "Successfully joined project",
      project,
    });
  } catch (error) {
    console.error("Join project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Leave project
// @route   POST /api/projects/:id/leave
// @access  Private
const leaveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Project owner cannot leave the project",
      });
    }

    const participant = project.participants.find(
      (p) =>
        p.user.toString() === req.user._id.toString() && p.status === "active"
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        error: "Not a member of this project",
      });
    }

    participant.status = "left";

    await project.save();

    res.status(200).json({
      success: true,
      message: "Successfully left project",
    });
  } catch (error) {
    console.error("Leave project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Add media to project
// @route   POST /api/projects/:id/media
// @access  Private (participants with media management permission)
const addMedia = async (req, res) => {
  try {
    const { mediaId, role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canManageMedia(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to manage media in this project",
      });
    }

    const media = await Media.findById(mediaId);
    if (!media || !media.canView(req.user._id)) {
      return res.status(404).json({
        success: false,
        error: "Media not found or not accessible",
      });
    }

    const existingMedia = project.media.find(
      (m) => m.mediaItem.toString() === mediaId
    );
    if (existingMedia) {
      return res.status(400).json({
        success: false,
        error: "Media already added to project",
      });
    }

    project.media.push({
      mediaItem: mediaId,
      addedBy: req.user._id,
      role: role || "primary",
    });

    await project.save();
    await project.populate(
      "media.mediaItem",
      "title cloudUrl thumbnailUrl mediaType category"
    );

    res.status(200).json({
      success: true,
      message: "Media added to project successfully",
      project,
    });
  } catch (error) {
    console.error("Add media error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/* ===========================
   MILESTONES
   =========================== */

// @desc    Create milestone
// @route   POST /api/projects/:id/milestones
// @access  Private (owner o canEdit)
const createMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to manage milestones for this project",
      });
    }

    const { title, description, dueDate, status, order, assignedTo } = req.body;

    await project.addMilestone({
      title,
      description,
      dueDate,
      status,
      order,
      assignedTo,
    });

    res.status(201).json({
      success: true,
      milestones: project.milestones,
    });
  } catch (error) {
    console.error("Create milestone error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update milestone
// @route   PATCH /api/projects/:id/milestones/:milestoneId
// @access  Private (owner o canEdit)
const updateMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to manage milestones for this project",
      });
    }

    const milestoneId = req.params.milestoneId;
    const updates = {};

    [
      "title",
      "description",
      "dueDate",
      "status",
      "order",
      "assignedTo",
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const result = await project.updateMilestone(milestoneId, updates);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Milestone not found",
      });
    }

    res.status(200).json({
      success: true,
      milestones: project.milestones,
    });
  } catch (error) {
    console.error("Update milestone error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete milestone
// @route   DELETE /api/projects/:id/milestones/:milestoneId
// @access  Private (owner o canEdit)
const deleteMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    if (!project.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to manage milestones for this project",
      });
    }

    const milestoneId = req.params.milestoneId;
    const result = await project.removeMilestone(milestoneId);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Milestone not found",
      });
    }

    res.status(200).json({
      success: true,
      milestones: project.milestones,
    });
  } catch (error) {
    console.error("Delete milestone error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

module.exports = {
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
};
