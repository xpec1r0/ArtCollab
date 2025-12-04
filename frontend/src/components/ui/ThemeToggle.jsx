import React from "react";
import { Moon, SunMedium } from "lucide-react";

const ThemeToggle = ({ theme, onToggle }) => {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={`theme-toggle ${
        isLight ? "theme-toggle--light" : "theme-toggle--dark"
      }`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          {isLight ? (
            <SunMedium className="theme-toggle-icon" />
          ) : (
            <Moon className="theme-toggle-icon" />
          )}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
