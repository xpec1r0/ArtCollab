import React from "react";
import "./footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Top area */}
        <div className="footer-top">
          {/* Brand / mission */}
          <div className="footer-column footer-brand">
            <div className="footer-logo-mark">
              <span className="footer-logo-text">AC</span>
            </div>

            <div className="footer-brand-text">
              <h3 className="footer-title">ArtCollab</h3>
              <p className="footer-text">
                A collaborative home for illustrators, writers, performers,
                musicians, and every creator experimenting at the edges.
              </p>
            </div>
          </div>

          {/* Product */}
          <div className="footer-column">
            <h4 className="footer-subtitle">Product</h4>
            <ul className="footer-links">
              <li>
                <a href="#projects">Live projects</a>
              </li>
              <li>
                <a href="#media">Media gallery</a>
              </li>
              <li>
                <a href="#studios">Studios &amp; spaces</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="footer-column">
            <h4 className="footer-subtitle">Community</h4>
            <ul className="footer-links">
              <li>
                <a href="#residencies">Residencies</a>
              </li>
              <li>
                <a href="#challenges">Challenges</a>
              </li>
              <li>
                <a href="#curators">Curators</a>
              </li>
              <li>
                <a href="#guidelines">Community guidelines</a>
              </li>
            </ul>
          </div>

          {/* Newsletter / contact */}
          <div className="footer-column footer-newsletter">
            <h4 className="footer-subtitle">Stay in the loop</h4>
            <p className="footer-text">
              Monthly highlights of new collaborations, calls, and curated
              stories from the community.
            </p>

            <form
              className="footer-newsletter-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="you@example.com"
                className="footer-input"
              />
              <button type="submit" className="footer-newsletter-btn">
                Subscribe
              </button>
            </form>

            <div className="footer-social">
              <button
                type="button"
                className="social-icon-button"
                aria-label="Facebook"
              >
                <span className="social-icon-glyph">f</span>
              </button>
              <button
                type="button"
                className="social-icon-button"
                aria-label="Instagram"
              >
                <span className="social-icon-glyph">ig</span>
              </button>
              <button
                type="button"
                className="social-icon-button"
                aria-label="X (Twitter)"
              >
                <span className="social-icon-glyph">x</span>
              </button>
              <button
                type="button"
                className="social-icon-button"
                aria-label="Behance"
              >
                <span className="social-icon-glyph">Bē</span>
              </button>
              <button
                type="button"
                className="social-icon-button"
                aria-label="Dribbble"
              >
                <span className="social-icon-glyph">Dr</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span className="footer-bottom-text">
            © {year} ArtCollab. All rights reserved.
          </span>
          <div className="footer-bottom-links">
            <a href="#terms">Terms</a>
            <a href="#privacy">Privacy</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
