// backend/controllers/mediaController.js
const Media = require("../models/Media");
const User = require("../models/User");
const {
  cloudinary,
  uploadBuffer,
  deleteFromCloudinary,
} = require("../utils/cloudinary");

// @desc    Get all media
// @route   GET /api/media
// @access  Public
const getMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    // Build query - only show public published media by default
    let query = {
      visibility: "public",
      status: "published",
    };

    // Search by title or description
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q, "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by media type
    if (req.query.mediaType) {
      query.mediaType = req.query.mediaType;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase());
      query.tags = { $in: tags };
    }

    // Filter featured
    if (req.query.featured === "true") {
      query.isFeatured = true;
    }

    // Sort options
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith("-")
        ? req.query.sort.slice(1)
        : req.query.sort;
      const sortOrder = req.query.sort.startsWith("-") ? -1 : 1;

      if (sortField === "likes") {
        // Sort by number of likes
        sortBy = { likeCount: sortOrder };
      } else {
        sortBy[sortField] = sortOrder;
      }
    } else {
      sortBy.createdAt = -1; // Default sort by newest
    }

    const media = await Media.find(query)
      .populate("owner", "firstName lastName username profilePicture")
      .populate("collaborators.user", "firstName lastName username")
      .sort(sortBy)
      .limit(limit)
      .skip(startIndex);

    const total = await Media.countDocuments(query);

    // Pagination info
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
    console.error("Get media error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get single media item
// @route   GET /api/media/:id
// @access  Public/Private (depends on visibility)
const getMediaItem = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate("owner", "firstName lastName username profilePicture bio")
      .populate(
        "collaborators.user",
        "firstName lastName username profilePicture"
      )
      .populate("likes.user", "firstName lastName username");

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    const userId = req.user ? req.user._id : null;
    if (!media.canView(userId)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this media",
      });
    }

    // Increment view count (only if not the owner)
    if (!userId || userId.toString() !== media.owner._id.toString()) {
      await media.incrementViews();
    }

    res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Get media item error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Create new media item (upload file + metadata)
// @route   POST /api/media
// @access  Private
const createMedia = async (req, res) => {
  let uploadResult = null;

  try {
    const {
      title,
      description,
      mediaType,
      category,
      visibility,
      tags,
      metadata,
    } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Media file is required",
      });
    }

    // Deducimos resourceType para Cloudinary según el mime
    let resourceType = "raw";
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else {
      resourceType = "raw";
    }

    // Subir a Cloudinary
    uploadResult = await uploadBuffer(file.buffer, {
      folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER || "artcollab_media"}/${
        category || "uncategorized"
      }`,
      resourceType,
    });

    const cloudUrl = uploadResult.secure_url || uploadResult.url;
    let thumbnailUrl = "";

    // Si es imagen, generamos URL de thumbnail optimizada
    if (uploadResult.resource_type === "image") {
      thumbnailUrl = cloudinary.url(uploadResult.public_id, {
        width: 400,
        height: 400,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      });
    }

    const media = await Media.create({
      title,
      description,
      mediaType,
      category,
      fileName: uploadResult.public_id,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      cloudUrl,
      thumbnailUrl,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryResourceType: uploadResult.resource_type || resourceType,
      owner: req.user._id,
      visibility: visibility || "public",
      tags: Array.isArray(tags)
        ? tags
        : tags
        ? String(tags)
            .split(",")
            .map((t) => t.trim().toLowerCase())
        : [],
      metadata: metadata || {},
    });

    await media.populate("owner", "firstName lastName username profilePicture");

    res.status(201).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Create media error:", error);

    // Si falló después de subir a Cloudinary, limpiamos el archivo remoto
    if (uploadResult && uploadResult.public_id) {
      try {
        await deleteFromCloudinary(
          uploadResult.public_id,
          uploadResult.resource_type
        );
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Update media item
// @route   PUT /api/media/:id
// @access  Private (owner or collaborator with edit permission)
const updateMedia = async (req, res) => {
  try {
    let media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    if (!media.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to edit this media",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "visibility",
      "tags",
      "metadata",
      "status",
      "isFeatured",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    media = await Media.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "firstName lastName username profilePicture")
      .populate("collaborators.user", "firstName lastName username");

    res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("Update media error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Delete media item
// @route   DELETE /api/media/:id
// @access  Private (owner only)
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    if (media.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this media",
      });
    }

    // Borrar de Cloudinary si tenemos publicId
    if (media.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(
          media.cloudinaryPublicId,
          media.cloudinaryResourceType || "image"
        );
      } catch (cloudErr) {
        console.error("Cloudinary delete error:", cloudErr);
        // No bloqueamos el borrado local por error en Cloudinary
      }
    }

    await Media.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * @desc    Upload avatar or profile cover image
 * @route   POST /api/media/profile-image
 * @access  Private
 */
const uploadProfileImage = async (req, res) => {
  try {
    const file = req.file;
    // 'avatar' | 'cover'
    const kind = req.body.kind === "cover" ? "cover" : "avatar";

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Image file is required",
      });
    }

    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        error: "Only image files are allowed",
      });
    }

    const folderBase =
      process.env.CLOUDINARY_UPLOAD_FOLDER || "artcollab_media";
    const subFolder = kind === "cover" ? "profile_covers" : "avatars";

    // Sube el blob recortado desde el front
    const uploadResult = await uploadBuffer(file.buffer, {
      folder: `${folderBase}/${subFolder}`,
      resourceType: "image",
    });

    const secureUrl = uploadResult.secure_url || uploadResult.url;

    // 👇 Esta será la URL que mandamos al frontend
    let url = secureUrl;

    // Para AVATAR sí generamos miniatura cuadrada (400x400)
    if (kind === "avatar") {
      url = cloudinary.url(uploadResult.public_id, {
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face",
        quality: "auto",
        fetch_format: "auto",
        secure: true,
      });
    }

    // Guardamos opcionalmente como Media (por si lo quieres en la galería)
    const media = await Media.create({
      title: kind === "avatar" ? "Profile avatar" : "Profile cover",
      description:
        kind === "avatar" ? "User profile avatar" : "User profile cover image",
      mediaType: "image",
      category: "other", // 👈 compatible con el enum del modelo Media
      fileName: uploadResult.public_id,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      cloudUrl: secureUrl, // original subido
      thumbnailUrl: url, // lo que realmente usas como avatar/cover
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryResourceType: uploadResult.resource_type || "image",
      owner: req.user._id,
      visibility: "private",
      metadata: { kind }, // 'avatar' | 'cover'
    });

    // 🔹 Actualizar directamente el usuario (profilePicture / coverImage)
    const user = await User.findById(req.user._id);
    if (user) {
      if (kind === "avatar") {
        user.profilePicture = url;
      } else {
        // asegúrate de tener coverImage en el schema del User
        user.coverImage = url;
      }
      await user.save();
    }

    return res.status(201).json({
      success: true,
      media,
      url, // 👈 ESTA es la que usas en front como profilePicture / coverImage
    });
  } catch (error) {
    console.error("Upload profile image error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while uploading profile image",
    });
  }
};

// @desc    Like/Unlike media
// @route   POST /api/media/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    if (!media.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this media",
      });
    }

    const existingLike = media.likes.find(
      (like) => like.user.toString() === req.user._id.toString()
    );

    let action;
    if (existingLike) {
      await media.removeLike(req.user._id);
      action = "unliked";
    } else {
      await media.addLike(req.user._id);
      action = "liked";
    }

    const updatedMedia = await Media.findById(req.params.id).populate(
      "owner",
      "firstName lastName username"
    );

    res.status(200).json({
      success: true,
      action,
      likeCount: updatedMedia.likeCount,
      media: updatedMedia,
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Add collaborator to media
// @route   POST /api/media/:id/collaborators
// @access  Private (owner only)
const addCollaborator = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    if (media.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to add collaborators",
      });
    }

    const collaborator = await User.findById(userId);
    if (!collaborator) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const existingCollaborator = media.collaborators.find(
      (collab) => collab.user.toString() === userId
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        error: "User is already a collaborator",
      });
    }

    media.collaborators.push({
      user: userId,
      role: role || "viewer",
    });

    await media.save();
    await media.populate(
      "collaborators.user",
      "firstName lastName username profilePicture"
    );

    res.status(200).json({
      success: true,
      message: "Collaborator added successfully",
      media,
    });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Remove collaborator from media
// @route   DELETE /api/media/:id/collaborators/:userId
// @access  Private (owner only)
const removeCollaborator = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    if (media.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to remove collaborators",
      });
    }

    media.collaborators = media.collaborators.filter(
      (collab) => collab.user.toString() !== req.params.userId
    );

    await media.save();

    res.status(200).json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// @desc    Get media categories
// @route   GET /api/media/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = [
      "painting",
      "music",
      "design",
      "illustration",
      "storytelling",
      "photography",
      "sculpture",
      "digital_art",
      "other",
    ];

    const categoryCounts = await Media.aggregate([
      { $match: { visibility: "public", status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const categoriesWithCounts = categories.map((category) => {
      const categoryData = categoryCounts.find((c) => c._id === category);
      return {
        name: category,
        count: categoryData ? categoryData.count : 0,
      };
    });

    res.status(200).json({
      success: true,
      categories: categoriesWithCounts,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

const uploadProjectCover = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Cover image file is required",
      });
    }

    // Solo aceptamos imágenes para cover
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        error: "Cover image must be an image file",
      });
    }

    const folderBase =
      process.env.CLOUDINARY_UPLOAD_FOLDER || "artcollab_media";

    // Subimos a Cloudinary usando el helper genérico
    const uploadResult = await uploadBuffer(file.buffer, {
      folder: `${folderBase}/project_covers`,
      resourceType: "image",
    });

    const secureUrl = uploadResult.secure_url || uploadResult.url;

    // Thumbnail (por si lo quieres más adelante)
    const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
      width: 800,
      height: 450,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });

    return res.status(201).json({
      success: true,
      secureUrl,
      url: secureUrl,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      thumbnailUrl,
    });
  } catch (error) {
    console.error("Upload project cover error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error while uploading cover image",
    });
  }
};

module.exports = {
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
};
