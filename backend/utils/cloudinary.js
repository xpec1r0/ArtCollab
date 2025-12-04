// backend/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DEFAULT_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || 'artcollab_media';

/**
 * Sube un buffer a Cloudinary usando upload_stream.
 * resourceType: 'image' | 'video' | 'raw' | 'auto'
 */
const uploadBuffer = (buffer, options = {}) => {
  const {
    folder = DEFAULT_FOLDER,
    resourceType = 'auto',
    publicId,
    eager
  } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType
    };

    if (publicId) uploadOptions.public_id = publicId;
    if (eager) uploadOptions.eager = eager;

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    stream.end(buffer);
  });
};

/**
 * Elimina un recurso de Cloudinary por public_id.
 */
const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  if (!publicId) return Promise.resolve(null);

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType
  });
};

module.exports = {
  cloudinary,
  uploadBuffer,
  deleteFromCloudinary
};
