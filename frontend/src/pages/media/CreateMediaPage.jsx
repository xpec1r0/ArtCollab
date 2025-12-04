// src/pages/media/CreateMediaPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMedia } from "../../api/media";
import Button from "../../components/ui/Button";
import {
  Loader2,
  UploadCloud,
  Image,
  FileText,
  Music2,
  Video,
} from "lucide-react";
import "./media-upload.css";

const MEDIA_TYPES = [
  { value: "image", label: "Image", icon: Image },
  { value: "audio", label: "Audio", icon: Music2 },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
  { value: "other", label: "Other", icon: FileText },
];

const CATEGORIES = [
  { value: "painting", label: "Painting" },
  { value: "music", label: "Music" },
  { value: "design", label: "Design" },
  { value: "illustration", label: "Illustration" },
  { value: "storytelling", label: "Storytelling" },
  { value: "photography", label: "Photography" },
  { value: "sculpture", label: "Sculpture" },
  { value: "digital_art", label: "Digital art" },
  { value: "other", label: "Other" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "collaborators", label: "Collaborators" },
];

function CreateMediaPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [category, setCategory] = useState("digital_art");
  const [visibility, setVisibility] = useState("public");
  const [tagsInput, setTagsInput] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    setFile(picked);
    setFormError(null);
    setUploadProgress(0);

    if (picked.type.startsWith("image/")) {
      const url = URL.createObjectURL(picked);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const picked = event.dataTransfer.files?.[0];
    if (!picked) return;
    setFile(picked);
    setFormError(null);
    setUploadProgress(0);

    if (picked.type.startsWith("image/")) {
      const url = URL.createObjectURL(picked);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!file) {
      setFormError("Please choose a file to upload.");
      return;
    }

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    const tags =
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    try {
      const media = await createMedia(
        {
          file,
          title: title.trim(),
          description: description.trim(),
          mediaType,
          category,
          visibility,
          tags,
          metadata: {},
        },
        {
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            const percent = Math.round((evt.loaded * 100) / evt.total);
            setUploadProgress(percent);
          },
        }
      );

      navigate(`/media/${media._id || media.id}`);
    } catch (err) {
      console.error("Error creating media", err);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "There was a problem uploading your media.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="media-upload-page art-page-background">
      <div className="media-upload-shell">
        <header className="media-upload-header">
          <div>
            <p className="media-upload-kicker">Upload to ArtCollab</p>
            <h1 className="media-upload-title h-display">New media</h1>
            <p className="media-upload-subtitle">
              Upload an image, audio, video or document. Files are stored in
              Cloudinary and attached to your ArtCollab profile.
            </p>
          </div>
        </header>

        <form
          className="media-upload-layout"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="media-upload-main">
            <div className="media-upload-card">
              {formError && (
                <div className="media-upload-error">{formError}</div>
              )}

              {/* File dropzone */}
              <div className="media-upload-field">
                <label className="media-upload-label">File</label>
                <div
                  className="media-upload-dropzone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    className="media-upload-input"
                    onChange={handleFileChange}
                    // backend ya controla tipos, pero limitamos un poco aquí
                    accept="image/*,audio/*,video/*,application/pdf"
                  />
                  <div className="media-upload-dropzone-inner">
                    <UploadCloud className="media-upload-dropzone-icon" />
                    <div className="media-upload-dropzone-text">
                      <span>Click to choose a file</span>
                      <span>or drag &amp; drop it here</span>
                      <span className="media-upload-dropzone-sub">
                        Up to 20&nbsp;MB. Images, audio, video or PDF.
                      </span>
                    </div>
                  </div>
                </div>

                {file && (
                  <p className="media-upload-file-meta">
                    Selected: <strong>{file.name}</strong>{" "}
                    <span>
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                      {file.type || "unknown"})
                    </span>
                  </p>
                )}

                {previewUrl && (
                  <div className="media-upload-preview">
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img
                      src={previewUrl}
                      className="media-upload-preview-img"
                    />
                  </div>
                )}

                {saving && uploadProgress > 0 && (
                  <div className="media-upload-progress">
                    <div className="media-upload-progress-bar">
                      <div
                        className="media-upload-progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="media-upload-progress-label">
                      Uploading… {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="media-upload-field">
                <label className="media-upload-label">
                  Title <span className="required-indicator">*</span>
                </label>
                <input
                  type="text"
                  className="media-upload-text-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Give this piece a name"
                />
              </div>

              {/* Description */}
              <div className="media-upload-field">
                <label className="media-upload-label">Description</label>
                <textarea
                  className="media-upload-textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional: describe the story, tools or process behind this work."
                />
              </div>

              {/* Tags */}
              <div className="media-upload-field">
                <label className="media-upload-label">Tags</label>
                <input
                  type="text"
                  className="media-upload-text-input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Comma-separated: ambient, glitch, fantasy, ink…"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="media-upload-sidebar">
            <div className="media-upload-card">
              <h2 className="media-upload-card-title">Media details</h2>

              {/* Media type */}
              <div className="media-upload-field">
                <label className="media-upload-label">Type</label>
                <div className="media-upload-pill-group">
                  {MEDIA_TYPES.map((opt) => {
                    const Icon = opt.icon;
                    const active = mediaType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`media-upload-pill ${
                          active ? "is-active" : ""
                        }`}
                        onClick={() => setMediaType(opt.value)}
                      >
                        <Icon className="media-upload-pill-icon" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="media-upload-field">
                <label className="media-upload-label">Category</label>
                <select
                  className="media-upload-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility */}
              <div className="media-upload-field">
                <label className="media-upload-label">Visibility</label>
                <div className="media-upload-radio-group">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`media-upload-radio-option ${
                        visibility === opt.value ? "is-active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={opt.value}
                        checked={visibility === opt.value}
                        onChange={() => setVisibility(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="media-upload-actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>{saving ? "Uploading…" : "Publish media"}</span>
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}

export default CreateMediaPage;
