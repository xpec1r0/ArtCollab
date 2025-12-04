// src/pages/projects/CreateProjectPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button.jsx";

import {
  ImagePlus,
  Loader2,
  Lock,
  Globe2,
  X,
  UserPlus2,
  Search,
} from "lucide-react";

import "./project-create.css";

const DISCIPLINE_OPTIONS = [
  { value: "visual", label: "Visual & digital" },
  { value: "literary", label: "Literary" },
  { value: "performance", label: "Performance" },
  { value: "sound", label: "Sound / music" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "collaboration", label: "Collaboration" },
  { value: "portfolio", label: "Solo / portfolio" },
  { value: "studio", label: "Studio / collective" },
];

function normalizeUserList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("collaboration");
  const [disciplines, setDisciplines] = useState([]);
  const [visibility, setVisibility] = useState("private");

  const [cover, setCover] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState(null);

  const [collaborators, setCollaborators] = useState([]);

  const [collabQuery, setCollabQuery] = useState("");
  const [collabResults, setCollabResults] = useState([]);
  const [collabSearching, setCollabSearching] = useState(false);
  const [collabError, setCollabError] = useState(null);

  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const canHaveCollaborators = projectType !== "portfolio";

  const toggleDiscipline = (value) => {
    setDisciplines((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleVisibilityChange = (value) => {
    setVisibility(value);
  };

  const handleProjectTypeChange = (value) => {
    setProjectType(value);
  };

  const closeCollabModal = () => {
    setIsCollabModalOpen(false);
    setCollabQuery("");
    setCollabResults([]);
    setCollabError(null);
    setCollabSearching(false);
  };

  const handleCoverChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverError(null);
    setCoverUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/media/projects/cover", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data || {};
      setCover({
        url: data.secureUrl || data.secure_url || data.url,
        publicId: data.publicId || data.public_id,
      });
    } catch (err) {
      console.error("Error uploading cover", err);
      if (axios.isAxiosError(err)) {
        setCoverError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "There was a problem uploading your cover image."
        );
      } else {
        setCoverError("Unexpected error while uploading your image.");
      }
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = () => {
    setCover(null);
    setCoverError(null);
  };

  useEffect(() => {
    if (!isCollabModalOpen || !canHaveCollaborators) {
      return;
    }

    if (!collabQuery || collabQuery.trim().length < 2) {
      setCollabResults([]);
      setCollabError(null);
      setCollabSearching(false);
      return;
    }

    const query = collabQuery.trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setCollabSearching(true);
      setCollabError(null);

      try {
        const res = await api.get("/users/search", {
          params: { q: query, limit: 6 },
          signal: controller.signal,
        });

        const list = normalizeUserList(res.data);
        const currentId = user?._id || user?.id;

        const filtered = list.filter((u) => {
          const id = u._id || u.id;
          if (!id) return false;
          if (id === currentId) return false;
          if (collaborators.some((c) => (c._id || c.id) === id)) {
            return false;
          }
          return true;
        });

        setCollabResults(filtered);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error("Error searching collaborators", err);
        setCollabError("Could not search collaborators right now.");
      } finally {
        setCollabSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [
    collabQuery,
    collaborators,
    user,
    isCollabModalOpen,
    canHaveCollaborators,
  ]);

  const handleAddCollaborator = (candidate) => {
    const id = candidate._id || candidate.id;
    if (!id) return;

    setCollaborators((prev) => {
      if (prev.some((c) => (c._id || c.id) === id)) return prev;
      return [...prev, candidate];
    });

    setCollabQuery("");
    setCollabResults([]);
  };

  const handleRemoveCollaborator = (idToRemove) => {
    setCollaborators((prev) =>
      prev.filter((c) => (c._id || c.id) !== idToRemove)
    );
  };

  const collaboratorChips = collaborators.map((c) => {
    const id = c._id || c.id;
    const name =
      c.username || c.name || c.displayName || c.email || "Collaborator";
    return (
      <span key={id} className="project-create-collab-chip">
        <span className="project-create-collab-chip-avatar">
          {name?.[0]?.toUpperCase() || "A"}
        </span>
        <span className="project-create-collab-chip-label">{name}</span>
        <button
          type="button"
          className="project-create-collab-chip-remove"
          onClick={() => handleRemoveCollaborator(id)}
          aria-label={`Remove ${name}`}
        >
          <X className="project-create-collab-chip-remove-icon" />
        </button>
      </span>
    );
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Please add a title for your project.");
      return;
    }

    if (!description.trim()) {
      setFormError("Please add a short description for your project.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tagline: tagline.trim() || undefined,
        projectType,
        disciplines,
        visibility,
        isPublic: visibility === "public",

        owner: user?._id || user?.id,

        collaborators: canHaveCollaborators
          ? collaborators.map((c) => c._id || c.id).filter(Boolean)
          : [],
        coverImage: cover
          ? {
              url: cover.url,
              publicId: cover.publicId,
            }
          : undefined,
      };

      const res = await api.post("/projects", payload);
      const created = res.data?.project || res.data;
      const projectId = created?._id || created?.id;

      navigate("/my-projects");
    } catch (err) {
      console.error("Error creating project", err);
      if (axios.isAxiosError(err)) {
        setFormError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to create your project. Please try again."
        );
      } else {
        setFormError("Unexpected error while creating your project.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/my-projects");
  };

  return (
    <section className="project-create-page art-page-background">
      <div className="project-create-shell">
        <div className="project-create-inner">
          <header className="project-create-header">
            <div>
              <p className="project-create-kicker">Start a project</p>
              <h1 className="project-create-title h-display">
                New collaborative project
              </h1>
              <p className="project-create-subtitle">
                Set up the basics now. You can change collaborators, cover and
                visibility anytime later.
              </p>
            </div>

            <div className="project-create-header-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                form="project-create-form"
                disabled={saving}
              >
                {saving && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                <span>{saving ? "Creating…" : "Create project"}</span>
              </Button>
            </div>
          </header>

          <form
            id="project-create-form"
            className="project-create-layout"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="project-create-main">
              <div className="project-create-card">
                {formError && (
                  <div className="project-create-form-error">{formError}</div>
                )}

                <div className="project-create-field">
                  <label className="project-create-label">
                    Project title<span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    className="project-create-input"
                    placeholder="Give your project a clear, evocative name"
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="project-create-hint">
                    This is what collaborators and visitors will see first.
                  </p>
                </div>

                <div className="project-create-field">
                  <label className="project-create-label">
                    One-line summary
                  </label>
                  <input
                    type="text"
                    className="project-create-input"
                    placeholder="Optional: a short tagline for this project"
                    maxLength={160}
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>

                <div className="project-create-field">
                  <label className="project-create-label">
                    Description
                    <span className="required-indicator">*</span>
                  </label>
                  <textarea
                    className="project-create-textarea"
                    rows={6}
                    placeholder="Describe what you want to create together, references, goals and any constraints."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="project-create-hint">
                    You can paste links, moodboards or prompts here; everyone in
                    the project will see this first.
                  </p>
                </div>

                <div className="project-create-grid-row">
                  <div className="project-create-field">
                    <label className="project-create-label">Project type</label>
                    <div className="project-create-pill-group">
                      {PROJECT_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`project-create-pill ${
                            projectType === opt.value ? "is-active" : ""
                          }`}
                          onClick={() => handleProjectTypeChange(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="project-create-field">
                    <label className="project-create-label">Disciplines</label>
                    <div className="project-create-pill-group">
                      {DISCIPLINE_OPTIONS.map((opt) => {
                        const active = disciplines.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`project-create-pill ${
                              active ? "is-active" : ""
                            }`}
                            onClick={() => toggleDiscipline(opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="project-create-hint">
                      Used to help people discover and filter public projects.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colaboradores */}
              <div className="project-create-card">
                <div className="project-create-card-header">
                  <h2 className="project-create-card-title">Collaborators</h2>
                  <p className="project-create-card-subtitle">
                    Invite other ArtCollab users to co-own, co-lead or
                    contribute to this project.
                  </p>
                </div>

                {canHaveCollaborators ? (
                  <>
                    {collaborators.length > 0 ? (
                      <div className="project-create-collab-chips">
                        {collaboratorChips}
                      </div>
                    ) : (
                      <p className="project-create-hint">
                        No collaborators yet. You&apos;re always added as
                        project owner.
                      </p>
                    )}

                    <div className="project-create-collab-manage-row">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollabModalOpen(true)}
                      >
                        Manage collaborators
                      </Button>
                      {collaborators.length > 0 && (
                        <span className="project-create-collab-count">
                          {collaborators.length} added
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="project-create-hint">
                    Solo / portfolio projects are just for you. Switch the
                    project type to &quot;Collaboration&quot; or &quot;Studio /
                    collective&quot; if you want to invite collaborators.
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="project-create-sidebar">
              {/* Visibility */}
              <div className="project-create-card">
                <div className="project-create-card-header">
                  <h2 className="project-create-card-title">Visibility</h2>
                  <p className="project-create-card-subtitle">
                    Choose who can see this project on ArtCollab.
                  </p>
                </div>

                <div className="project-create-visibility-group">
                  <button
                    type="button"
                    className={`project-create-visibility-option ${
                      visibility === "private" ? "is-active" : ""
                    }`}
                    onClick={() => handleVisibilityChange("private")}
                  >
                    <div className="project-create-visibility-icon-wrap">
                      <Lock className="project-create-visibility-icon" />
                    </div>
                    <div className="project-create-visibility-text">
                      <span className="project-create-visibility-title">
                        Private
                      </span>
                      <span className="project-create-visibility-sub">
                        Only you and invited collaborators can see this project.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`project-create-visibility-option ${
                      visibility === "public" ? "is-active" : ""
                    }`}
                    onClick={() => handleVisibilityChange("public")}
                  >
                    <div className="project-create-visibility-icon-wrap project-create-visibility-icon-wrap--public">
                      <Globe2 className="project-create-visibility-icon" />
                    </div>
                    <div className="project-create-visibility-text">
                      <span className="project-create-visibility-title">
                        Public
                      </span>
                      <span className="project-create-visibility-sub">
                        Visible in Explore &amp; Projects. Great for open calls,
                        showcases and commissions.
                      </span>
                    </div>
                  </button>
                </div>

                <p className="project-create-visibility-hint">
                  You can change this later. Public projects will appear in the
                  main Projects listing.
                </p>
              </div>

              {/* Cover image */}
              <div className="project-create-card">
                <div className="project-create-card-header">
                  <h2 className="project-create-card-title">Cover image</h2>
                  <p className="project-create-card-subtitle">
                    Optional, but highly recommended. This appears in grids and
                    headers.
                  </p>
                </div>

                <div className="project-create-cover">
                  <label className="project-create-cover-drop">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="project-create-cover-input"
                    />
                    {!cover && (
                      <div className="project-create-cover-empty">
                        <div className="project-create-cover-icon-wrap">
                          {coverUploading ? (
                            <Loader2 className="project-create-cover-icon animate-spin" />
                          ) : (
                            <ImagePlus className="project-create-cover-icon" />
                          )}
                        </div>
                        <div className="project-create-cover-text">
                          <span className="project-create-cover-title">
                            {coverUploading
                              ? "Uploading cover…"
                              : "Upload or drag a cover image"}
                          </span>
                          <span className="project-create-cover-sub">
                            Recommended 1600×900px. PNG or JPG up to 5&nbsp;MB.
                          </span>
                        </div>
                      </div>
                    )}

                    {cover && (
                      <div className="project-create-cover-preview">
                        <div className="project-create-cover-preview-img-wrap">
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img
                            src={cover.url}
                            className="project-create-cover-preview-img"
                          />
                          <button
                            type="button"
                            className="project-create-cover-remove"
                            onClick={handleRemoveCover}
                            aria-label="Remove cover image"
                          >
                            <X className="project-create-cover-remove-icon" />
                          </button>
                        </div>
                        <p className="project-create-cover-sub">
                          Click to replace the image.
                        </p>
                      </div>
                    )}
                  </label>

                  {coverError && (
                    <div className="project-create-inline-error">
                      {coverError}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </form>
        </div>
      </div>

      {/* Modal de colaboradores tipo GitHub */}
      {canHaveCollaborators && isCollabModalOpen && (
        <div
          className="project-create-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="collab-modal-title"
        >
          <div className="project-create-modal">
            <div className="project-create-modal-header">
              <div>
                <h2
                  id="collab-modal-title"
                  className="project-create-modal-title"
                >
                  Add collaborators
                </h2>
                <p className="project-create-modal-subtitle">
                  Search by username, name or email. You&apos;re always the
                  project owner; collaborators get shared access.
                </p>
              </div>
              <button
                type="button"
                className="project-create-modal-close"
                onClick={closeCollabModal}
                aria-label="Close collaborators dialog"
              >
                <X className="project-create-modal-close-icon" />
              </button>
            </div>

            <div className="project-create-modal-body">
              <div className="project-create-field">
                <label className="project-create-label">Search users</label>
                <div className="project-create-collab-input-row">
                  <Search className="project-create-collab-icon" />
                  <input
                    type="text"
                    className="project-create-input project-create-input--bare"
                    placeholder="Search by username, name or email"
                    value={collabQuery}
                    onChange={(e) => setCollabQuery(e.target.value)}
                  />
                  {collabSearching && (
                    <Loader2 className="project-create-collab-spinner animate-spin" />
                  )}
                </div>
                <p className="project-create-hint">
                  Type at least two characters to search in ArtCollab.
                </p>

                {collabError && (
                  <div className="project-create-inline-error">
                    {collabError}
                  </div>
                )}
              </div>

              {collabResults.length > 0 && (
                <div className="project-create-collab-results">
                  {collabResults.map((candidate) => {
                    const id = candidate._id || candidate.id;
                    const name =
                      candidate.username ||
                      candidate.name ||
                      candidate.displayName ||
                      candidate.email;
                    return (
                      <button
                        key={id}
                        type="button"
                        className="project-create-collab-result"
                        onClick={() => handleAddCollaborator(candidate)}
                      >
                        <div className="project-create-collab-result-main">
                          <div className="project-create-collab-avatar">
                            {name?.[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div className="project-create-collab-name">
                              {name}
                            </div>
                            {candidate.email && (
                              <div className="project-create-collab-email">
                                {candidate.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <UserPlus2 className="project-create-collab-add-icon" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="project-create-modal-section">
                <h3 className="project-create-modal-section-title">
                  Current collaborators
                </h3>
                {collaborators.length === 0 ? (
                  <p className="project-create-hint">
                    No collaborators yet. Start typing to invite someone.
                  </p>
                ) : (
                  <div className="project-create-collab-chips">
                    {collaboratorChips}
                  </div>
                )}
              </div>

              <div className="project-create-modal-footer">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeCollabModal}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CreateProjectPage;
