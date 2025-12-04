// src/pages/homepage.jsx
import React, { useEffect, useRef } from "react";
import "./homepage.css";
import { Link } from "react-router-dom";

// 🔹 Nuevos componentes UI (ajusta paths según tu estructura)
import Card from "../../components/ui/Card";
import CardGrid from "../../components/ui/CardGrid";
import ArtMosaicCarousel from "../../components/ui/ArtMosaicCarousel";

// Data del carrusel (solo data, nada de lógica)
const GALLERY_SLIDES = [
  {
    id: "gallery-1",
    type: "mosaic",
    hero: "/images/homepage/show1-1.jpg",
    heroAlt: "Neon city artworks collection",
    columns: [
      [
        { src: "/images/homepage/show1-2.jpg" },
        { src: "/images/homepage/show1-3.jpg" },
      ],
      [
        { src: "/images/homepage/show1-4.jpg" },
        { src: "/images/homepage/show1-5.jpg" },
      ],
      [
        { src: "/images/homepage/show1-6.jpg" },
        { src: "/images/homepage/show1-7.jpg" },
      ],
    ],
  },
  {
    id: "gallery-2",
    type: "mosaic",
    hero: "/images/homepage/show2-1.jpg",
    heroAlt: "Mixed media and UI explorations",
    columns: [
      [
        { src: "/images/homepage/show2-2.png" },
        { src: "/images/homepage/show2-3.png" },
      ],
      [
        { src: "/images/homepage/show2-4.jpg" },
        { src: "/images/homepage/show2-5.png" },
      ],
      [
        { src: "/images/homepage/show2-6.png" },
        { src: "/images/homepage/show2-7.png" },
      ],
    ],
  },
  {
    id: "gallery-3",
    type: "mosaic",
    hero: "/images/homepage/show3-1.jpg",
    heroAlt: "Concept art and photography gallery",
    columns: [
      [
        { src: "/images/homepage/show3-2.jpg" },
        { src: "/images/homepage/show3-3.png" },
      ],
      [
        { src: "/images/homepage/show3-4.png" },
        { src: "/images/homepage/show3-5.jpg" },
      ],
      [
        { src: "/images/homepage/show3-6.jpg" },
        { src: "/images/homepage/show3-7.png" },
      ],
    ],
  },
  {
    id: "story-1",
    type: "story",
    eyebrow: "Featured story",
    headline: "Loneliness Goes for Your Eyes First",
    excerpt:
      "The day should have started out normal. A boring class, an exhausting routine—something predictable. Instead, fear crept over us like a cold mist, sinking into my bones. By the time I realized something was terribly wrong, it was already too late.",
    link: "https://onyxmusings.substack.com/p/loneliness-goes-for-your-eyes-first?r=5o9jti&utm_campaign=post&utm_medium=web&triedRedirect=true",
    ctaLabel: "Read full story →",
    image: "/images/homepage/story.jpg",
    imageAlt:
      "Illustration for the story Loneliness Goes for Your Eyes First",
  },
];

const Homepage = () => {
  // -----------------------
  // TYPING ANIMATION FOR QUOTE
  // -----------------------
  const quoteRef = useRef(null);
  const authorRef = useRef(null);

  useEffect(() => {
    const element = quoteRef.current;
    const author = authorRef.current;
    if (!element) return;

    const text =
      `"Art, to me, is absolute expression. It is not science but rather it's when science becomes loose and mastered."`;
    const typingText = element.querySelector(".typing-text");
    const cursor = element.querySelector(".cursor");

    let index = 0;
    let hasStarted = false;

    const type = () => {
      if (!typingText || !cursor) return;

      if (index < text.length) {
        typingText.textContent = text.substring(0, index + 1);
        index++;
        const delay = 40 + Math.random() * 80;
        setTimeout(type, delay);
      } else {
        cursor.style.display = "none";
        if (author) {
          author.style.opacity = "1";
          author.style.transform = "translateY(0)";
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            hasStarted = true;
            element.style.opacity = "1";
            type();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <p className="hero-eyebrow">
              ArtCollab · Online studios for humans who make art
            </p>

            <h1 className="hero-title h-display">
              A home for bold, collaborative art.
            </h1>

            <p className="hero-copy">
              Turn sketches, demos and drafts into living projects with curated
              feedback, shared studios and tools built for artists, not
              algorithms.
            </p>

            <div className="hero-metrics">
              <span className="metric-pill">
                Visual · Sound · Writing · Performance
              </span>
              <span className="metric-pill metric-pill-soft">
                Critique circles · Residency-style projects
              </span>
            </div>

            <div className="hero-actions">
              <Link to="/studios">
                <button className="hero-btn hero-btn-primary">
                  Enter live studios
                </button>
              </Link>
              <Link to="/projects">
                <button className="hero-btn hero-btn-ghost">
                  Browse collaborations
                </button>
              </Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-art-stack">
              <div className="hero-main-frame">
                <div className="hero-main-image">
                  <img
                    src="/images/homepage/hero.jpg"
                    alt="Curated artworks dashboard"
                  />
                </div>
              </div>

              <div className="hero-meta-row">
                <div className="hero-mini-card">
                  <div className="hero-mini-headline-row">
                    <span className="hero-mini-dot hero-mini-dot-live" />
                    <span className="hero-mini-label">Live now</span>
                    <span className="hero-mini-pill">Collab session</span>
                  </div>
                  <p className="hero-mini-title">“Midnight neon city”</p>
                  <p className="hero-mini-meta">
                    6 artists co-editing in real time.
                  </p>
                </div>

                <div className="hero-mini-card hero-mini-card-secondary">
                  <div className="hero-mini-headline-row">
                    <span className="hero-mini-label">Critique queue</span>
                  </div>
                  <p className="hero-mini-title">12 pieces waiting</p>
                  <p className="hero-mini-meta">
                    Average 8 min to first feedback.
                  </p>
                  <div className="hero-mini-progress">
                    <div className="hero-mini-progress-bar" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS SECTION */}
      <section className="section2" id="section2">
        <div className="section2-inner">
          <h2 className="section-title h-display">
            Move fluidly across disciplines.
          </h2>
          <p className="section-subtitle">
            Bring your whole practice—visual, sound, text, movement—and find
            people who speak your language.
          </p>

          <CardGrid>
            <Card>
              <div className="card-tag">Visual</div>
              <img
                src="/images/homepage/digital.jpg"
                alt="Visual Arts"
                className="card-img"
              />
              <h3>Visual Arts</h3>
              <p>
                Digital art, painting, illustration, photography, 3D, concept
                art and more—curated in living series, not just static uploads.
              </p>
              <button className="learn-btn">Explore visual studios</button>
            </Card>

            <Card>
              <div className="card-tag">Writing</div>
              <img
                src="/images/homepage/literary.jpg"
                alt="Literary Arts"
                className="card-img"
              />
              <h3>Literary Arts</h3>
              <p>
                Poetry, fiction, essays and scripts with line-by-line feedback,
                private circles and long-form projects.
              </p>
              <button className="learn-btn">Join a writing circle</button>
            </Card>

            <Card>
              <div className="card-tag">Performance</div>
              <img
                src="/images/homepage/performing.jpg"
                alt="Performing Arts"
                className="card-img"
              />
              <h3>Performing Arts</h3>
              <p>
                Dance, acting, music and hybrid performance pieces with
                rehearsal notes, recordings and live sessions.
              </p>
              <button className="learn-btn">Discover movement labs</button>
            </Card>
          </CardGrid>
        </div>
      </section>

      {/* SLIDESHOW SECTION */}
      <section className="section3" id="section3">
        <div className="section3-inner">
          <div className="section3-header">
            <h2 className="section3-title h-display">
              From sketchbook to shared gallery.
            </h2>
            <p className="section3-subtitle">
              Mix media, pin works-in-progress and build story-driven
              collections that evolve with your collaborators.
            </p>
          </div>

          <ArtMosaicCarousel slides={GALLERY_SLIDES} />
        </div>
      </section>

      {/* 🔹 NUEVA SECTION – QUALITY / PRACTICE FOCUSED */}
      <section className="section4">
        <div className="section4-inner">
          <div className="section4-header">
            <h2 className="section4-title h-display">
              Built for serious art practice.
            </h2>
            <p className="section4-subtitle">
              Not another feed. A studio environment where critique, process and
              collaboration are first-class citizens.
            </p>
          </div>

          <div className="section4-grid">
            <Card className="section4-card">
              <p className="section4-eyebrow">Critique as a ritual</p>
              <h3>Deep feedback, not empty reactions.</h3>
              <p>
                Structured critique queues, prompts and reply threads that help
                you receive feedback you can actually work with, no noise.
              </p>
            </Card>

            <Card className="section4-card">
              <p className="section4-eyebrow">Residency-style projects</p>
              <h3>Work in chapters, not isolated posts.</h3>
              <p>
                Build long-form projects with milestones, process notes and
                parallel timelines for different media in the same space.
              </p>
            </Card>

            <Card className="section4-card">
              <p className="section4-eyebrow">Cross-discipline studios</p>
              <h3>Where image, sound and text collide.</h3>
              <p>
                Pair visual artists with writers, sound designers and
                performers. Hybrid studios designed for experiments, not
                algorithms.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* TYPING QUOTE SECTION */}
      <section className="quote-section">
        <div className="quote-box glass-quote">
          <p ref={quoteRef} className="quote">
            <span className="typing-text"></span>
            <span className="cursor">|</span>
          </p>
          <span
            ref={authorRef}
            className="quote-author"
            style={{ opacity: 0, transform: "translateY(12px)" }}
          >
            — Oyinkansola Aiyelotan
          </span>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section className="section5">
        <div className="section5-inner">
          <div className="section5-grid">
            <div className="text-left">
              <p className="section5-eyebrow">
                For collectives, schools & spaces
              </p>
              <h2 className="title h-display">
                Connect.
                <br />
                Collaborate. Create.
              </h2>
              <p className="text-body">
                Launch a cross-disciplinary lab, host a cohort or build a
                private studio for your community. Tell us what you&apos;re
                dreaming of and we&apos;ll help you shape it.
              </p>
            </div>

            <div>
              <form className="contact-form">
                <div className="contact-form-grid">
                  <label className="contact_name">Your name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="response"
                  />
                </div>
                <div className="contact-form-grid">
                  <label className="contact_email">Your email</label>
                  <input
                    type="email"
                    placeholder="email@website.com"
                    className="response"
                  />
                </div>
                <div className="contact-form-grid">
                  <label className="contact_message">
                    Your project or idea
                  </label>
                  <textarea
                    placeholder="Tell us about your practice, cohort or residency idea..."
                    className="response"
                    rows={4}
                  />
                </div>
                <button type="submit" className="submit-btn">
                  Share your idea
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
