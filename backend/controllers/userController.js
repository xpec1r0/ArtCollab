// backend/controllers/userController.js
const User = require("../models/User");
const Media = require("../models/Media");
const Project = require("../models/Project");

// Helper: payload para perfil privado (ajustes)
const buildPrivateUserPayload = (user) => {
  if (!user) return null;
  const publicProfile = user.getPublicProfile();
  return {
    ...publicProfile,
    email: user.email,
  };
};

// @desc    Get all users (public profiles)
// @route   GET /api/users
// @access  Public (viewer opcional)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    // Search by name or username
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
      ];
    }

    // Filter by specialization
    if (req.query.specialization) {
      query.specializations = req.query.specialization;
    }

    // Filter by openToCollab
    if (req.query.openToCollab === "true") {
      query.openToCollab = true;
    }

    // Sort options
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-")
        ? req.query.sort.slice(1)
        : req.query.sort;
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1; // Default sort by newest
    }

    const users = await User.find(query)
      .select(
        "-password -refreshTokens -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire"
      )
      .sort(sortBy)
      .limit(limit)
      .skip(startIndex);

    const total = await User.countDocuments(query);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      users: users.map((user) => user.getPublicProfile()),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single user by ID (public profile)
// @route   GET /api/users/:id
// @access  Public (viewer opcional)
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshTokens -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire"
    );

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const profile = user.getPublicProfile();

    profile.isMe = !!currentUserId && currentUserId === user._id.toString();
    profile.isFollowedByViewer =
      !!currentUserId &&
      Array.isArray(user.followers) &&
      user.followers.some((id) => id.toString() === currentUserId);

    res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get current logged-in user profile (para sección de ajustes)
// @route   GET /api/users/me
// @access  Private
const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshTokens -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire"
    );

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: buildPrivateUserPayload(user),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update current user's profile (nombre, bio, avatar, prefs, social)
// @route   PATCH /api/users/me/profile
// @access  Private
const updateCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const {
      firstName,
      lastName,
      bio,
      tagline,
      location,
      openToCollab,
      specializations,
      profilePicture,
      coverImage, // 👈 NUEVO
      socialLinks,
    } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (tagline !== undefined) user.tagline = tagline;
    if (location !== undefined) user.location = location;

    if (typeof openToCollab === "boolean") {
      user.openToCollab = openToCollab;
    }

    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    // 👇 guardar cover del perfil
    if (coverImage !== undefined) {
      user.coverImage = coverImage;
    }

    if (specializations !== undefined) {
      if (Array.isArray(specializations)) {
        user.specializations = specializations;
      } else if (typeof specializations === "string") {
        user.specializations = [specializations];
      }
    }

    if (socialLinks && typeof socialLinks === "object") {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: buildPrivateUserPayload(user),
    });
  } catch (error) {
    console.error("Update current user profile error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Change current user's password
// @route   PATCH /api/users/me/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from current password",
      });
    }

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Deactivate current user's account
// @route   DELETE /api/users/me
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    user.isActive = false;
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get user's media
// @route   GET /api/users/:id/media
// @access  Public (owner ve privado)
const getUserMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    let query = {
      owner: req.params.id,
      status: "published",
    };

    // If not the owner, only show public media
    if (!req.user || req.user._id.toString() !== req.params.id) {
      query.visibility = "public";
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.mediaType) {
      query.mediaType = req.query.mediaType;
    }

    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-")
        ? req.query.sort.slice(1)
        : req.query.sort;
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1;
    }

    const media = await Media.find(query)
      .populate("owner", "firstName lastName username profilePicture")
      .sort(sortBy)
      .limit(limit)
      .skip(startIndex);

    const total = await Media.countDocuments(query);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMedia: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: media.length,
      pagination,
      media,
    });
  } catch (error) {
    console.error("Get user media error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get user's projects
// @route   GET /api/users/:id/projects
// @access  Public (owner ve privados donde participa)
const getUserProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    let query = {
      $or: [
        { owner: req.params.id },
        { "participants.user": req.params.id, "participants.status": "active" },
      ],
    };

    if (!req.user || req.user._id.toString() !== req.params.id) {
      query.visibility = "public";
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-")
        ? req.query.sort.slice(1)
        : req.query.sort;
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1;
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
    console.error("Get user projects error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: "Cannot follow yourself",
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({
        success: false,
        error: "Not authorized",
      });
    }

    const alreadyFollowing =
      Array.isArray(targetUser.followers) &&
      targetUser.followers.some(
        (id) => id.toString() === currentUserId.toString()
      );

    let action;

    if (alreadyFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      action = "unfollow";
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
      action = "follow";
    }

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.status(200).json({
      success: true,
      action,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    console.error("Toggle follow error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const mediaStats = await Media.aggregate([
      {
        $match: { owner: user._id, status: "published", visibility: "public" },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
    ]);

    const projectStats = await Project.aggregate([
      {
        $match: {
          $or: [
            { owner: user._id },
            { "participants.user": user._id, "participants.status": "active" },
          ],
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalMedia = await Media.countDocuments({
      owner: userId,
      status: "published",
      visibility: "public",
    });

    const totalProjects = await Project.countDocuments({
      $or: [
        { owner: userId },
        { "participants.user": userId, "participants.status": "active" },
      ],
    });

    res.status(200).json({
      success: true,
      stats: {
        totalMedia,
        totalProjects,
        mediaByCategory: mediaStats,
        projectsByStatus: projectStats,
        memberSince: user.createdAt,
        lastActive: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  changePassword,
  deactivateAccount,
  getUserMedia,
  getUserProjects,
  toggleFollow,
  getUserStats,
};
