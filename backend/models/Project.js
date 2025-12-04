// backend/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic information
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Project category and type
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: [
      'painting',
      'music',
      'design',
      'illustration',
      'storytelling',
      'photography',
      'sculpture',
      'digital_art',
      'mixed_media',
      'performance',
      'other'
    ]
  },
  projectType: {
    type: String,
    required: [true, 'Project type is required'],
    enum: ['solo', 'collaboration', 'commission', 'contest']
  },
  
  // Ownership and leadership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  
  // Participants and roles
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'co-lead', 'contributor', 'reviewer', 'viewer'],
      default: 'contributor'
    },
    permissions: {
      canEdit: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false },
      canManageMedia: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'left', 'removed'],
      default: 'active'
    }
  }],
  
  // Project media and assets
  media: [{
    mediaItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['primary', 'reference', 'draft', 'final'],
      default: 'primary'
    }
  }],
  
  // Project timeline and milestones
  milestones: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Milestone description cannot exceed 500 characters']
    },
    dueDate: Date,
    completedAt: Date,
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    },
    order: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Project status and visibility
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'participants_only'],
    default: 'participants_only'
  },
  
  // Project settings
  settings: {
    allowPublicApplications: {
      type: Boolean,
      default: false
    },
    requireApprovalForJoining: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    }
  },
  
  // Tags and search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  deadline: Date,
  
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Featured flag
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/* ===========================
   HELPERS INTERNOS
   =========================== */

const toUserId = (userOrId) => {
  if (!userOrId) return null;
  if (typeof userOrId === 'string') return userOrId;
  if (userOrId._id) return userOrId._id.toString();
  return userOrId.toString();
};

/* ===========================
   VIRTUALS
   =========================== */

// Virtual for participant count
projectSchema.virtual('participantCount').get(function() {
  return this.participants
    ? this.participants.filter(p => p.status === 'active').length
    : 0;
});

// Virtual for like count
projectSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count (Feedback.targetType = 'Project')
projectSchema.virtual('commentCount', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'targetId',
  count: true,
  match: { targetType: 'Project', feedbackType: 'comment' }
});

// Virtual for media count
projectSchema.virtual('mediaCount').get(function() {
  return this.media ? this.media.length : 0;
});

/* ===========================
   INDEXES
   =========================== */

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'participants.user': 1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ visibility: 1, status: 1 });
projectSchema.index({ isFeatured: 1 });

/* ===========================
   PERMISOS / ROLES
   =========================== */

projectSchema.methods.isOwner = function(userOrId) {
  const uid = toUserId(userOrId);
  if (!uid) return false;
  return this.owner.toString() === uid;
};

projectSchema.methods.isActiveParticipant = function(userOrId) {
  const uid = toUserId(userOrId);
  if (!uid) return false;
  return this.participants.some(
    (p) => p.user.toString() === uid && p.status === 'active'
  );
};

// Method to get user's role in project
projectSchema.methods.getUserRole = function(userOrId) {
  const uid = toUserId(userOrId);
  if (!uid) return null;

  if (this.owner.toString() === uid) return 'owner';

  const participant = this.participants.find(
    (p) => p.user.toString() === uid && p.status === 'active'
  );

  return participant ? participant.role : null;
};

// Permiso general de edición de proyecto
projectSchema.methods.canEdit = function(userOrId) {
  const uid = toUserId(userOrId);
  if (!uid) return false;

  if (this.owner.toString() === uid) return true;

  const participant = this.participants.find(
    (p) => p.user.toString() === uid && p.status === 'active'
  );

  return !!(participant && participant.permissions.canEdit);
};

// Permiso para invitar gente
projectSchema.methods.canInvite = function(userOrId) {
  const uid = toUserId(userOrId);
  if (!uid) return false;

  if (this.owner.toString() === uid) return true;

  const participant = this.participants.find(
    (p) => p.user.toString() === uid && p.status === 'active'
  );

  return !!(participant && participant.permissions.canInvite);
};

// Permiso para gestionar media
projectSchema.methods.canManageMedia = function(userOrId) {
  const uid = toUserId(userOrId);
  if (!uid) return false;

  if (this.owner.toString() === uid) return true;

  const participant = this.participants.find(
    (p) => p.user.toString() === uid && p.status === 'active'
  );

  return !!(participant && participant.permissions.canManageMedia);
};

/* ===========================
   VISIBILIDAD
   =========================== */

// Method to check if user can view this project
projectSchema.methods.canView = function(userOrId) {
  const uid = toUserId(userOrId);

  // Usuario NO logeado → solo proyectos públicos
  if (!uid) {
    return this.visibility === 'public';
  }

  if (this.visibility === 'public') return true;

  if (this.visibility === 'private') {
    return this.owner.toString() === uid;
  }

  if (this.visibility === 'participants_only') {
    if (this.owner.toString() === uid) return true;
    return this.participants.some(
      (p) => p.user.toString() === uid && p.status === 'active'
    );
  }

  return false;
};

/* ===========================
   PARTICIPANTES
   =========================== */

// Método para saber si ya se alcanzó el máximo
projectSchema.methods.hasReachedMaxParticipants = function() {
  if (!this.settings || !this.settings.maxParticipants) return false;
  const activeCount = this.participantCount;
  return activeCount >= this.settings.maxParticipants;
};

// Method to add participant (invitation-style)
projectSchema.methods.addParticipant = function(userId, role = 'contributor', invitedBy = null) {
  const uid = toUserId(userId);
  if (!uid) return this;

  const existingParticipant = this.participants.find(
    p => p.user.toString() === uid
  );
  
  if (existingParticipant) {
    // Reinvitar si estaba fuera
    if (['left', 'removed'].includes(existingParticipant.status)) {
      existingParticipant.status = 'invited';
      existingParticipant.joinedAt = new Date();
      existingParticipant.invitedBy = invitedBy || existingParticipant.invitedBy;
    }
    return this.save();
  }
  
  // Set permissions based on role
  let permissions = {
    canEdit: false,
    canInvite: false,
    canManageMedia: false,
    canDelete: false
  };
  
  if (role === 'co-lead') {
    permissions = {
      canEdit: true,
      canInvite: true,
      canManageMedia: true,
      canDelete: false
    };
  } else if (role === 'contributor') {
    permissions.canManageMedia = true;
  }
  
  this.participants.push({
    user: uid,
    role,
    permissions,
    invitedBy,
    status: 'invited'
  });
  
  return this.save();
};

// Method to remove participant (soft)
projectSchema.methods.removeParticipant = function(userId) {
  const uid = toUserId(userId);
  if (!uid) return this;

  const participant = this.participants.find(
    p => p.user.toString() === uid
  );
  if (participant) {
    participant.status = 'removed';
  }
  return this.save();
};

/* ===========================
   LIKES & VIEWS
   =========================== */

// Method to add like
projectSchema.methods.addLike = function(userId) {
  const uid = toUserId(userId);
  if (!uid) return this;

  const existingLike = this.likes.find(
    like => like.user.toString() === uid
  );
  if (!existingLike) {
    this.likes.push({ user: uid });
  }
  return this.save();
};

// Method to remove like
projectSchema.methods.removeLike = function(userId) {
  const uid = toUserId(userId);
  if (!uid) return this;

  this.likes = this.likes.filter(
    like => like.user.toString() !== uid
  );
  return this.save();
};

projectSchema.methods.incrementViews = function(viewerId) {
  const uid = toUserId(viewerId);
  // si no es participante activo, cuenta como view
  if (!uid || !this.isActiveParticipant(uid)) {
    this.views += 1;
  }
  return this.save();
};

/* ===========================
   MILESTONES
   =========================== */

projectSchema.methods.addMilestone = function(milestoneData) {
  this.milestones.push({
    ...milestoneData,
    createdAt: new Date()
  });
  return this.save();
};

projectSchema.methods.updateMilestone = function(milestoneId, updates) {
  const m = this.milestones.id(milestoneId);
  if (!m) return null;

  Object.assign(m, updates);

  if (updates.status === 'completed' && !m.completedAt) {
    m.completedAt = new Date();
  }

  return this.save();
};

projectSchema.methods.removeMilestone = function(milestoneId) {
  const m = this.milestones.id(milestoneId);
  if (!m) return null;

  m.remove();
  return this.save();
};

/* ===========================
   HOOKS
   =========================== */

// Asegurar que el owner está en participants como owner con full permisos
projectSchema.pre('save', function(next) {
  if (!this.owner) return next();

  const ownerId = this.owner.toString();
  const existing = this.participants.find(
    p => p.user.toString() === ownerId
  );

  if (!existing) {
    this.participants.push({
      user: this.owner,
      role: 'owner',
      permissions: {
        canEdit: true,
        canInvite: true,
        canManageMedia: true,
        canDelete: true
      },
      status: 'active',
      joinedAt: this.startDate || new Date()
    });
  } else {
    // Si ya existe, garantizamos que tenga rol y permisos de owner
    existing.role = 'owner';
    existing.permissions = {
      canEdit: true,
      canInvite: true,
      canManageMedia: true,
      canDelete: true
    };
    existing.status = 'active';
  }

  next();
});

module.exports = mongoose.model('Project', projectSchema);
