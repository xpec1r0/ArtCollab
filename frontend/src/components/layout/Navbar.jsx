// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import "./navbar.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import UserMenu from "../ui/UserMenu";

const THEME_STORAGE_KEY = "artcollab_theme";

const Navbar = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [theme, setTheme] = useState("dark");

  const dropdownRef = useRef(null);
  const lastScrollY = useRef(0);
  const exploreCloseTimeoutRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout, loading } = useAuth();
  const displayName = user?.username || user?.email || "Artist";
  const avatarUrl =
    user?.profilePicture || user?.avatarUrl || user?.profileImage || null;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
        return;
      }
    } catch {
      // ignore
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initial = prefersDark ? "dark" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(false);
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (Math.abs(diff) >= 8) {
        if (currentY > 80 && diff > 0) {
          setIsHidden(true);
        } else if (diff < 0) {
          setIsHidden(false);
        }
      }

      setIsAtTop(currentY <= 16);
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (exploreCloseTimeoutRef.current) {
        clearTimeout(exploreCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
    }
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNavClick = (to) => {
    navigate(to);
    setMobileOpen(false);
  };

  const handleProfile = () => {
    handleNavClick("/settings/profile");
  };

  const toggleMobile = () => {
    setMobileOpen((v) => !v);
  };

  const navClassName = [
    "navbar",
    isHidden ? "navbar--hidden" : "",
    isAtTop ? "navbar--at-top" : "navbar--scrolled",
  ]
    .filter(Boolean)
    .join(" ");

  const handleExploreEnter = () => {
    if (exploreCloseTimeoutRef.current) {
      clearTimeout(exploreCloseTimeoutRef.current);
      exploreCloseTimeoutRef.current = null;
    }
    setOpenDropdown(true);
  };

  const handleExploreLeave = () => {
    if (exploreCloseTimeoutRef.current) {
      clearTimeout(exploreCloseTimeoutRef.current);
    }
    exploreCloseTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(false);
    }, 150);
  };

  const megaThemeClass =
    theme === "light" ? "mega-menu--light" : "mega-menu--dark";

  return (
    <>
      <nav className={navClassName}>
        <div className="navbar-inner">
          {/* LEFT AREA: brand + links */}
          <div className="navbar-left">
            {/* Hamburger (mobile) */}
            <button
              type="button"
              className={`navbar-hamburger ${
                mobileOpen ? "navbar-hamburger--open" : ""
              }`}
              onClick={toggleMobile}
              aria-label="Open navigation"
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>

            {/* Brand */}
            <div className="navbar-brand" onClick={() => handleNavClick("/")}>
              <div className="brand-mark">
                <span className="brand-initials">AC</span>
              </div>
              <div className="brand-text">
                <span className="brand-name">ArtCollab</span>
                <span className="brand-tagline">
                  Curated spaces for bold creators
                </span>
              </div>
            </div>

            {/* Desktop links */}
            <ul className="navbar-links">
              <li
                className="navbar-link-item navbar-link-explore"
                ref={dropdownRef}
                onMouseEnter={handleExploreEnter}
                onMouseLeave={handleExploreLeave}
              >
                <button
                  type="button"
                  className="navbar-link-button"
                  onClick={() => setOpenDropdown((open) => !open)}
                >
                  <span>Explore</span>
                  <span className="navbar-link-pill">New</span>
                </button>

                {openDropdown && (
                  <div
                    className={`mega-menu ${megaThemeClass}`}
                    onMouseEnter={handleExploreEnter}
                    onMouseLeave={handleExploreLeave}
                  >
                    <div className="mega-header">
                      <h2>Explore Art</h2>
                      <p>
                        Discover disciplines, styles, and live collaborative
                        projects.
                      </p>
                    </div>

                    <div className="mega-grid">
                      <div className="mega-section">
                        <h3>Artists</h3>
                        <button
                          type="button"
                          onClick={() => handleNavClick("/projects")}
                        >
                          Top creators
                        </button>
                        <button type="button">Emerging voices</button>
                        <button type="button">Open to collaboration</button>
                      </div>

                      <div className="mega-section">
                        <h3>Media</h3>
                        <button type="button">Visual &amp; digital</button>
                        <button type="button">Performance</button>
                        <button type="button">Literary</button>
                      </div>

                      <div className="mega-section">
                        <h3>Projects</h3>
                        <button
                          type="button"
                          onClick={() => handleNavClick("/projects")}
                        >
                          Featured projects
                        </button>
                        <button type="button">Community challenges</button>
                        <button type="button">Commissions</button>
                      </div>

                      <div className="mega-section">
                        <h3>Curated</h3>
                        <button type="button">Staff picks</button>
                        <button type="button">Experimental labs</button>
                        <button type="button">Residency programs</button>
                      </div>
                    </div>
                  </div>
                )}
              </li>

              <li className="navbar-link-item">
                <button
                  type="button"
                  className="navbar-link-button"
                  onClick={() => handleNavClick("/projects")}
                >
                  Projects
                </button>
              </li>

              <li className="navbar-link-item">
                <button
                  type="button"
                  className="navbar-link-button"
                  onClick={() => handleNavClick("/about")}
                >
                  About
                </button>
              </li>

              <li className="navbar-link-item">
                <button
                  type="button"
                  className="navbar-link-button"
                  onClick={() => handleNavClick("/studios")}
                >
                  Studios
                </button>
              </li>
            </ul>
          </div>

          {/* RIGHT AREA: theme + auth */}
          <div className="navbar-right">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="nav-btn nav-btn-primary"
                  onClick={() => handleNavClick("/projects/new")}
                >
                  Start a project
                </button>

                <button
                  type="button"
                  className="nav-link-button"
                  onClick={() => handleNavClick("/my-projects")}
                >
                  My projects
                </button>

                <UserMenu
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                  theme={theme}
                  onProfile={handleProfile}
                  onLogout={handleLogout}
                  loading={loading}
                />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="nav-link-button"
                  onClick={() => handleNavClick("/login")}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="nav-btn nav-btn-primary"
                  onClick={() => handleNavClick("/signup")}
                >
                  Join ArtCollab
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE OVERLAY MENU */}
      {mobileOpen && (
        <div className="navbar-mobile-overlay">
          <div className="navbar-mobile-sheet">
            <div className="navbar-mobile-section">
              <span className="navbar-mobile-label">Discover</span>
              <button type="button" onClick={() => handleNavClick("/projects")}>
                Explore projects
              </button>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => handleNavClick("/projects/new")}
                >
                  Start a project
                </button>
              )}
              <button type="button">Media gallery</button>
              <button type="button">Open collaborations</button>
            </div>

            <div className="navbar-mobile-section">
              <span className="navbar-mobile-label">Platform</span>
              <button type="button" onClick={() => handleNavClick("/about")}>
                About ArtCollab
              </button>
              <button type="button">Studios &amp; spaces</button>
            </div>

            <div className="navbar-mobile-section">
              <span className="navbar-mobile-label">Account</span>
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick("/settings/profile")}
                  >
                    Profile & settings
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("/my-projects")}
                  >
                    My projects
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    {loading ? "Signing out..." : "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavClick("/login")}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavClick("/signup")}
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
