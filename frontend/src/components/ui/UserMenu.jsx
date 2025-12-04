import React, { useState, useRef, useEffect } from "react";
import { User as UserIcon } from "lucide-react";

const UserMenu = ({
  displayName,
  avatarUrl,
  theme,
  onProfile,
  onLogout,
  loading,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const closeTimeoutRef = useRef(null);

  const rootClasses = [
    "user-menu",
    theme === "light" ? "user-menu--light" : "user-menu--dark",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const hasAvatar = Boolean(avatarUrl);

  return (
    <div
      ref={ref}
      className={rootClasses}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Trigger */}
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={displayName || "User menu"}
      >
        <span
          className={`user-menu-avatar ${
            hasAvatar ? "user-menu-avatar--image" : "user-menu-avatar--icon"
          }`}
        >
          {hasAvatar ? (
            <img src={avatarUrl} alt={displayName} />
          ) : (
            <UserIcon className="user-menu-avatar-icon" />
          )}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="user-menu-dropdown">
          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              setOpen(false);
              onProfile?.();
            }}
          >
            Profile
          </button>
          <button
            type="button"
            className="user-menu-item user-menu-item--danger"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
            disabled={loading}
          >
            {loading ? "Signing out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
