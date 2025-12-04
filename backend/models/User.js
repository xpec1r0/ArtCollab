// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // Authentication fields
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // 👉 Role-based authorization for ArtCollab
    role: {
      type: String,
      enum: ["user", "collaborator", "support", "admin"],
      default: "user",
    },

    // Profile information
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },

    // Perfil pro
    tagline: {
      type: String,
      maxlength: [140, "Tagline cannot exceed 140 characters"],
      default: "",
    },
    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },
    openToCollab: {
      type: Boolean,
      default: true,
    },

    // Artist specializations
    specializations: [
      {
        type: String,
        enum: [
          "painting",
          "music",
          "design",
          "illustration",
          "storytelling",
          "photography",
          "sculpture",
          "digital_art",
          "other",
        ],
      },
    ],

    // Social links
    socialLinks: {
      website: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    // Follow system
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Authentication tokens
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 days
        },
      },
    ],

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Account verification
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    // Timestamps
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const salt = await bcrypt.genSalt(rounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

userSchema.methods.isStaff = function () {
  return this.role === "admin" || this.role === "support";
};

// Public profile shape (para UI de perfiles)
userSchema.methods.getPublicProfile = function () {
  const {
    _id,
    username,
    firstName,
    lastName,
    bio,
    profilePicture,
    tagline,
    location,
    openToCollab,
    specializations,
    socialLinks,
    role,
    isVerified,
    createdAt,
    lastLogin,
    followers,
    following,
    coverImage,
  } = this;

  return {
    id: _id,
    username,
    firstName,
    lastName,
    fullName: this.fullName,
    bio,
    profilePicture,
    coverImage,
    tagline,
    location,
    openToCollab,
    specializations,
    socialLinks,
    role,
    isVerified,
    createdAt,
    lastLogin,
    followersCount: Array.isArray(followers) ? followers.length : 0,
    followingCount: Array.isArray(following) ? following.length : 0,
  };
};

module.exports = mongoose.model("User", userSchema);
