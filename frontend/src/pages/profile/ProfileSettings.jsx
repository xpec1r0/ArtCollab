import React, { useCallback, useEffect, useRef, useState } from "react";
import "./profile-settings.css";
import { useAuth } from "../../context/AuthContext.jsx";
import Button from "../../components/ui/Button.jsx";
import TextField from "../../components/ui/TextField.jsx";
import toast from "react-hot-toast";
import {
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
  deactivateMyAccount,
} from "../../api/users";
import { uploadProfileImage } from "../../api/uploads";
import AvatarCropModal from "../../components/profile/AvatarCropModal.jsx";

const SPECIALIZATION_OPTIONS = [
  { value: "illustration", label: "Illustration & concept art" },
  { value: "storytelling", label: "Writing & storytelling" },
  { value: "music", label: "Music & sound" },
  { value: "design", label: "Design & visual direction" },
  { value: "digital_art", label: "Digital art & motion" },
  { value: "photography", label: "Photography" },
  { value: "performance", label: "Performance / live arts" },
  { value: "other", label: "Other / hybrid" },
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function ProfileSettings() {
  const { user: authUser, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("public");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const coverRef = useRef(null);

  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
    tagline: "",
    location: "",
    profilePicture: "",
    coverImage: "",
    openToCollab: true,
    specializations: [],
    socialLinks: {
      website: "",
      instagram: "",
      twitter: "",
      linkedin: "",
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropKind, setCropKind] = useState("avatar");
  const [coverAspect, setCoverAspect] = useState(3);

  const mergeProfileIntoForm = (userData) => {
    if (!userData) return;
    setForm((prev) => ({
      ...prev,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      username: userData.username || "",
      bio: userData.bio || "",
      tagline: userData.tagline || "",
      location: userData.location || "",
      profilePicture: userData.profilePicture || "",
      coverImage: userData.coverImage || "",
      openToCollab:
        typeof userData.openToCollab === "boolean"
          ? userData.openToCollab
          : true,
      specializations: Array.isArray(userData.specializations)
        ? userData.specializations
        : [],
      socialLinks: {
        website: userData.socialLinks?.website || "",
        instagram: userData.socialLinks?.instagram || "",
        twitter: userData.socialLinks?.twitter || "",
        linkedin: userData.socialLinks?.linkedin || "",
      },
    }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const fresh = await getMyProfile();

        if (cancelled) return;

        const finalProfile = fresh || authUser || null;
        setProfile(finalProfile);
        mergeProfileIntoForm(finalProfile);
      } catch (err) {
        console.error("Error loading profile settings:", err);

        const fallback = authUser || null;
        if (fallback) {
          setProfile(fallback);
          mergeProfileIntoForm(fallback);
        } else {
          toast.error("Could not load your profile.");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const measureCoverAspect = useCallback(() => {
    if (!coverRef.current) return;
    const rect = coverRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = rect.width / rect.height;
    if (Number.isFinite(ratio) && ratio > 0) {
      setCoverAspect(ratio);
    }
  }, []);

  useEffect(() => {
    if (!loadingProfile) {
      const id = setTimeout(measureCoverAspect, 0);
      return () => clearTimeout(id);
    }
  }, [loadingProfile, profile, measureCoverAspect]);

  useEffect(() => {
    window.addEventListener("resize", measureCoverAspect);
    return () => window.removeEventListener("resize", measureCoverAspect);
  }, [measureCoverAspect]);

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSocialChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [field]: value,
      },
    }));
  };

  const toggleSpecialization = (value) => {
    setForm((prev) => {
      const exists = prev.specializations.includes(value);
      return {
        ...prev,
        specializations: exists
          ? prev.specializations.filter((v) => v !== value)
          : [...prev.specializations, value],
      };
    });
  };

  const handleToggleCollab = () => {
    setForm((prev) => ({
      ...prev,
      openToCollab: !prev.openToCollab,
    }));
  };

  const openCropForFile = async (file, kind) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      if (!dataUrl) {
        throw new Error("Could not read image file.");
      }
      if (kind === "cover") {
        measureCoverAspect();
      }
      setCropKind(kind);
      setCropImageSrc(dataUrl);
      setCropModalOpen(true);
    } catch (err) {
      console.error("Error preparing image for crop:", err);
      toast.error("Could not open image. Try another file.");
    }
  };

  const handleCropModalClose = () => {
    setCropModalOpen(false);
    setCropImageSrc(null);
  };

  const handleCroppedImage = async (file) => {
    if (!file) {
      handleCropModalClose();
      return;
    }

    try {
      if (cropKind === "avatar") {
        setAvatarUploading(true);
        const { media, url } = await uploadProfileImage(file, {
          kind: "avatar",
        });
        const imageUrl = url;
        if (!imageUrl) throw new Error("No image URL returned.");

        setForm((prev) => ({
          ...prev,
          profilePicture: imageUrl,
        }));

        console.log("Avatar media created:", media);
        toast.success(
          "Profile picture uploaded. Don’t forget to save your profile."
        );
      } else {
        setCoverUploading(true);
        const { media, url } = await uploadProfileImage(file, {
          kind: "cover",
        });
        const imageUrl = url;
        if (!imageUrl) throw new Error("No cover URL returned.");

        setForm((prev) => ({
          ...prev,
          coverImage: imageUrl,
        }));

        console.log("Cover media created:", media);
        toast.success("Cover uploaded. Don’t forget to save your profile.");
      }
    } catch (err) {
      console.error("Error uploading cropped image:", err);
      toast.error("Could not upload image. Try again.");
    } finally {
      if (cropKind === "avatar") {
        setAvatarUploading(false);
      } else {
        setCoverUploading(false);
      }
      handleCropModalClose();
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      e.target.value = "";
      return;
    }

    await openCropForFile(file, "avatar");
    e.target.value = "";
    setAvatarMenuOpen(false);
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      e.target.value = "";
      return;
    }

    await openCropForFile(file, "cover");
    e.target.value = "";
    setCoverMenuOpen(false);
  };

  const handleAvatarMenuUpload = (e) => {
    e.stopPropagation();
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  const handleAvatarRemove = (e) => {
    e.stopPropagation();
    setForm((prev) => ({ ...prev, profilePicture: "" }));
    setAvatarMenuOpen(false);
  };

  const handleCoverMenuUpload = (e) => {
    e.stopPropagation();
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const handleCoverRemove = (e) => {
    e.stopPropagation();
    setForm((prev) => ({ ...prev, coverImage: "" }));
    setCoverMenuOpen(false);
  };

  const handleCoverClick = () => {
    if (!form.coverImage) {
      if (coverInputRef.current) {
        coverInputRef.current.click();
      }
    } else {
      setCoverMenuOpen((prev) => !prev);
    }
  };

  const handleSavePublicProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        tagline: form.tagline,
        location: form.location,
        profilePicture: form.profilePicture || "",
        coverImage: form.coverImage || "",
        socialLinks: form.socialLinks,
      };

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      mergeProfileIntoForm(updated);
      await refreshUser?.();
      toast.success("Profile updated");
    } catch (err) {
      console.error("Error updating public profile:", err);
      toast.error("Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSavingPreferences(true);

      const payload = {
        openToCollab: form.openToCollab,
        specializations: form.specializations,
        location: form.location,
      };

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      mergeProfileIntoForm(updated);
      await refreshUser?.();
      toast.success("Collaboration preferences updated");
    } catch (err) {
      console.error("Error updating preferences:", err);
      toast.error("Could not update preferences.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!currentPassword || !newPassword) {
      toast.error("Enter your current and new password.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password confirmation does not match.");
      return;
    }

    try {
      setChangingPassword(true);
      await updateMyPassword({ currentPassword, newPassword });
      toast.success("Password updated");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      console.error("Error updating password:", err);
      const msg =
        err?.response?.data?.message ||
        "Could not update password. Check your current password.";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? You will be signed out."
    );
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      await deactivateMyAccount();
      toast.success("Account deactivated");
      await logout();
    } catch (err) {
      console.error("Error deactivating account:", err);
      toast.error("Could not deactivate account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loadingProfile) {
    return (
      <main className="profile-settings-page art-page-background">
        <div className="profile-settings-center">
          <div className="profile-settings-loading-card glass-panel">
            <div className="profile-settings-spinner" />
            <p>Loading your studio profile…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-settings-page art-page-background">
        <div className="profile-settings-center">
          <div className="profile-settings-error-card glass-panel">
            <p className="profile-settings-error">
              We couldn&apos;t load your profile. Try signing out and back in.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const displayName =
    profile.fullName && profile.fullName.trim().length
      ? profile.fullName
      : profile.username;

  return (
    <main className="profile-settings-page art-page-background">
      {/* HERO: cover + avatar estilo Facebook */}
      <section className="profile-hero glass-panel gradient-border">
        <div
          ref={coverRef}
          className="profile-cover"
          onClick={handleCoverClick}
        >
          {form.coverImage ? (
            <img
              src={form.coverImage}
              alt="Profile cover"
              className="profile-cover-img"
            />
          ) : (
            <div className="profile-cover-empty">
              <span className="profile-cover-plus">+</span>
              <span className="profile-cover-text">Add cover image</span>
            </div>
          )}

          {form.coverImage && coverMenuOpen && (
            <div
              className="profile-cover-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={handleCoverMenuUpload}>
                Change cover image
              </button>
              <button type="button" onClick={handleCoverRemove}>
                Remove cover image
              </button>
            </div>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCoverFileChange}
            disabled={coverUploading}
          />
        </div>

        <div className="profile-hero-avatar-slot">
          <button
            type="button"
            className="profile-hero-avatar-button"
            onClick={() => setAvatarMenuOpen((prev) => !prev)}
          >
            {form.profilePicture ? (
              <img
                src={form.profilePicture}
                alt={displayName}
                className="profile-hero-avatar-img"
              />
            ) : (
              <div className="profile-hero-avatar-placeholder">
                <span>
                  {displayName
                    ?.split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "AC"}
                </span>
              </div>
            )}
          </button>

          {avatarMenuOpen && (
            <div
              className="profile-avatar-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={handleAvatarMenuUpload}>
                {form.profilePicture
                  ? "Change profile photo"
                  : "Upload profile photo"}
              </button>
              {form.profilePicture && (
                <button type="button" onClick={handleAvatarRemove}>
                  Remove profile photo
                </button>
              )}
            </div>
          )}

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarFileChange}
            disabled={avatarUploading}
          />
        </div>
      </section>

      {/* SHELL CENTRAL CON TÍTULO + TABS */}
      <section className="profile-settings-shell glass-panel">
        <header className="profile-shell-header">
          <div className="profile-shell-title-row">
            <div>
              <h1 className="profile-settings-title h-display">
                Account & profile
              </h1>
              <p className="profile-settings-subtitle">
                Adjust how you show up on ArtCollab, how you collaborate with
                others, and keep your account secure.
              </p>
            </div>

            <div className="profile-shell-meta-pill">
              <span className="profile-shell-meta-label">Signed in</span>
              <div className="profile-shell-meta-main">
                <span className="profile-shell-meta-username">
                  @{profile.username}
                </span>
                <span className="profile-shell-meta-separator">·</span>
                <span className="profile-shell-meta-email">
                  {profile.email}
                </span>
              </div>
            </div>
          </div>

          <nav className="profile-tabs-row">
            <button
              type="button"
              className={
                activeTab === "public"
                  ? "profile-tab profile-tab--active"
                  : "profile-tab"
              }
              onClick={() => setActiveTab("public")}
            >
              <span className="profile-tab-label">Public profile</span>
              <span className="profile-tab-caption">How others see you</span>
            </button>
            <button
              type="button"
              className={
                activeTab === "preferences"
                  ? "profile-tab profile-tab--active"
                  : "profile-tab"
              }
              onClick={() => setActiveTab("preferences")}
            >
              <span className="profile-tab-label">
                Collaboration preferences
              </span>
              <span className="profile-tab-caption">
                Open to collabs & disciplines
              </span>
            </button>
            <button
              type="button"
              className={
                activeTab === "security"
                  ? "profile-tab profile-tab--active"
                  : "profile-tab"
              }
              onClick={() => setActiveTab("security")}
            >
              <span className="profile-tab-label">Security & account</span>
              <span className="profile-tab-caption">
                Password & deactivation
              </span>
            </button>
          </nav>

          <p className="profile-shell-hint">
            Your changes are not public until you hit <strong>Save</strong> in
            each section.
          </p>
        </header>

        <div className="profile-settings-body">
          {activeTab === "public" && (
            <section className="profile-panel profile-panel--stack">
              <form onSubmit={handleSavePublicProfile} className="profile-card">
                <header className="profile-card-header">
                  <div>
                    <h2>Public profile</h2>
                    <p className="profile-panel-intro">
                      This is how other artists see you across projects,
                      feedback and search.
                    </p>
                  </div>
                </header>

                <div className="profile-card-body">
                  {/* Tagline */}
                  <div className="profile-form-row profile-form-row--full">
                    <label className="profile-label">Tagline</label>
                    <p className="profile-help">
                      A short line that appears next to your name on your
                      profile.
                    </p>
                    <TextField
                      id="tagline"
                      label="Tagline"
                      value={form.tagline}
                      onChange={handleFieldChange("tagline")}
                      maxLength={140}
                      placeholder="Illustrator & writer exploring hybrid narratives."
                    />
                  </div>

                  {/* Names */}
                  <div className="profile-form-row">
                    <TextField
                      id="firstName"
                      label="First name"
                      value={form.firstName}
                      onChange={handleFieldChange("firstName")}
                      autoComplete="given-name"
                    />
                    <TextField
                      id="lastName"
                      label="Last name"
                      value={form.lastName}
                      onChange={handleFieldChange("lastName")}
                      autoComplete="family-name"
                    />
                  </div>

                  {/* Username + location */}
                  <div className="profile-form-row">
                    <TextField
                      id="username"
                      label="Username"
                      value={form.username}
                      disabled
                      helperText="Usernames are not editable yet."
                    />
                    <TextField
                      id="location"
                      label="Location"
                      value={form.location}
                      onChange={handleFieldChange("location")}
                      placeholder="Mexico City · Remote"
                    />
                  </div>

                  {/* Bio */}
                  <div className="profile-form-row profile-form-row--full">
                    <div className="profile-textarea-group">
                      <label
                        htmlFor="bio"
                        className="profile-label profile-label--textarea"
                      >
                        Bio
                      </label>
                      <p className="profile-help">
                        Share a bit about what you create, what you&apos;re
                        exploring and how you like to collaborate.
                      </p>
                      <textarea
                        id="bio"
                        className="profile-textarea"
                        rows={4}
                        value={form.bio}
                        onChange={handleFieldChange("bio")}
                        maxLength={500}
                        placeholder="I work across illustration, sound design and interactive storytelling. Currently focused on collaborative pieces that mix visual worlds with spoken word and ambient music."
                      />
                      <span className="profile-char-counter">
                        {form.bio?.length || 0}/500
                      </span>
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="profile-form-row profile-form-row--full">
                    <div>
                      <h3 className="profile-subtitle">Social links</h3>
                      <p className="profile-help">
                        These appear on your public profile so collaborators can
                        discover more of your work.
                      </p>
                    </div>
                    <div className="profile-social-grid">
                      <TextField
                        id="website"
                        label="Website / portfolio"
                        value={form.socialLinks.website}
                        onChange={handleSocialChange("website")}
                        placeholder="https://your-portfolio.com"
                      />
                      <TextField
                        id="instagram"
                        label="Instagram"
                        value={form.socialLinks.instagram}
                        onChange={handleSocialChange("instagram")}
                        placeholder="@yourhandle"
                      />
                      <TextField
                        id="twitter"
                        label="X / Twitter"
                        value={form.socialLinks.twitter}
                        onChange={handleSocialChange("twitter")}
                        placeholder="@yourhandle"
                      />
                      <TextField
                        id="linkedin"
                        label="LinkedIn"
                        value={form.socialLinks.linkedin}
                        onChange={handleSocialChange("linkedin")}
                        placeholder="Profile URL"
                      />
                    </div>
                  </div>
                </div>

                <footer className="profile-card-footer">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={savingProfile}
                  >
                    Save public profile
                  </Button>
                </footer>
              </form>
            </section>
          )}

          {activeTab === "preferences" && (
            <section className="profile-panel profile-panel--stack">
              <form onSubmit={handleSavePreferences} className="profile-card">
                <header className="profile-card-header">
                  <div>
                    <h2>Collaboration preferences</h2>
                    <p className="profile-panel-intro">
                      Help others understand how and where you like to
                      collaborate.
                    </p>
                  </div>
                </header>

                <div className="profile-card-body">
                  {/* Open to collab */}
                  <div className="profile-form-row profile-form-row--full">
                    <div className="profile-toggle-row">
                      <button
                        type="button"
                        className={
                          form.openToCollab
                            ? "profile-toggle profile-toggle--on"
                            : "profile-toggle"
                        }
                        onClick={handleToggleCollab}
                      >
                        <span className="profile-toggle-thumb" />
                      </button>
                      <div>
                        <div className="profile-toggle-title">
                          Open to collaboration
                        </div>
                        <p className="profile-help">
                          When this is on, your profile surfaces as open to
                          collabs in search and project invites.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location como zona horaria/región */}
                  <div className="profile-form-row profile-form-row--full">
                    <TextField
                      id="locationPref"
                      label="Time zone / region"
                      value={form.location}
                      onChange={handleFieldChange("location")}
                      placeholder="e.g. UTC-5, Mexico / LATAM"
                    />
                  </div>

                  {/* Specializations */}
                  <div className="profile-form-row profile-form-row--full">
                    <div>
                      <h3 className="profile-subtitle">Art disciplines</h3>
                      <p className="profile-help">
                        Choose the disciplines that best match your current
                        work. This helps people find you for the right projects.
                      </p>
                    </div>
                    <div className="profile-chips-grid">
                      {SPECIALIZATION_OPTIONS.map((opt) => {
                        const active = form.specializations.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={
                              active
                                ? "profile-chip profile-chip--active"
                                : "profile-chip"
                            }
                            onClick={() => toggleSpecialization(opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <footer className="profile-card-footer">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={savingPreferences}
                  >
                    Save preferences
                  </Button>
                </footer>
              </form>
            </section>
          )}

          {activeTab === "security" && (
            <section className="profile-panel profile-panel--grid">
              {/* Card: Change password */}
              <form onSubmit={handleChangePassword} className="profile-card">
                <header className="profile-card-header">
                  <h2>Change password</h2>
                  <p className="profile-panel-intro">
                    Use a strong, unique password that you don&apos;t reuse on
                    other platforms.
                  </p>
                </header>

                <div className="profile-card-body">
                  <div className="profile-form-row profile-form-row--full">
                    <TextField
                      id="currentPassword"
                      label="Current password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="profile-form-row profile-form-row--full">
                    <TextField
                      id="newPassword"
                      label="New password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                    <TextField
                      id="confirmNewPassword"
                      label="Confirm new password"
                      type="password"
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmNewPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <footer className="profile-card-footer">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={changingPassword}
                  >
                    Update password
                  </Button>
                </footer>
              </form>

              {/* Card: Danger zone */}
              <div className="profile-card profile-card--danger">
                <header className="profile-card-header">
                  <h2>Deactivate account</h2>
                  <p className="profile-panel-intro">
                    Deactivating hides your profile and projects from others.
                    You can contact support to restore it later.
                  </p>
                </header>
                <div className="profile-card-body">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="profile-danger-btn"
                    loading={deletingAccount}
                    onClick={handleDeactivateAccount}
                  >
                    Deactivate my account
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      </section>

      {/* Modal de crop para avatar/cover */}
      <AvatarCropModal
        open={cropModalOpen}
        src={cropImageSrc}
        kind={cropKind}
        coverAspect={coverAspect}
        onClose={handleCropModalClose}
        onCropped={handleCroppedImage}
      />
    </main>
  );
}

export default ProfileSettings;
