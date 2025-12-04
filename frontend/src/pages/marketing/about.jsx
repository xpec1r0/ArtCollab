// src/pages/marketing/about.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./about.css";

const About = () => {
  return (
    <main className="about-page art-page-background">
      {/* HERO: qué es ArtCollab */}
      <section className="about-hero">
        <div className="about-hero-text">
          <p className="about-kicker">About ArtCollab</p>
          <h1 className="about-hero-title h-display">
            A shared studio for cross-disciplinary art.
          </h1>
          <p className="about-hero-subtitle">
            ArtCollab is where illustrators, writers, musicians, performers,
            designers and experimental creators turn loose ideas into finished
            projects—together, not alone. Start a project, invite collaborators
            and build pieces that none of you could have created on your own.
          </p>

          <div className="about-hero-actions">
            <Link to="/projects" className="about-btn about-btn-primary">
              Explore projects
            </Link>
            <Link to="/projects/new" className="about-btn about-btn-ghost">
              Start a new project
            </Link>
          </div>

          <dl className="about-hero-stats">
            <div className="about-stat-item">
              <dt>Built for</dt>
              <dd>visual, sound, literary & performance arts</dd>
            </div>
            <div className="about-stat-item">
              <dt>What you get</dt>
              <dd>collaborative projects, shared media & feedback</dd>
            </div>
            <div className="about-stat-item">
              <dt>Collaboration style</dt>
              <dd>co-leads, contributors & open studio vibes</dd>
            </div>
          </dl>
        </div>

        <div className="about-hero-art">
          <div className="about-orbit about-orbit-main" />
          <div className="about-orbit about-orbit-secondary" />
          <div className="about-hero-pill-row">
            <span className="about-pill">🖌️ Illustration</span>
            <span className="about-pill">🎧 Sound & music</span>
          </div>
          <div className="about-hero-pill-row about-hero-pill-row-lower">
            <span className="about-pill">📖 Storytelling</span>
            <span className="about-pill">🎭 Performance</span>
            <span className="about-pill">💻 Digital art</span>
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="vision-section">
        <div className="vision-wrapper">
          <div className="vision-text">
            <h2>Our vision</h2>
            <p>
              We imagine a world where artists of every kind—painters, writers,
              performers, musicians, designers and digital creators—share a
              common studio, no matter where they live.
              <br />
              <br />
              A place where collaboration is the default, not the exception.
              Where you can drop an idea, find the right partners and watch it
              grow into something much bigger than any individual style or
              discipline.
              <br />
              <br />
              ArtCollab exists to make that studio real: accessible, safe and
              vibrant, so that bold, hybrid projects can actually find a home.
            </p>
          </div>

          <div className="vision-image">
            <img src="/images/about/vision.jpg" alt="Artists collaborating" />
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="mission-section">
        <h2 className="mission-title">Our mission</h2>
        <p className="mission-intro">
          ArtCollab is built around one simple idea:{" "}
          <strong>when artists collaborate with structure and respect, the work
          gets deeper, not messier.</strong> Everything in the platform is
          designed to support that.
        </p>

        <div className="mission-grid">
          <article className="mission-card">
            <img src="/images/about/mission1.jpg" alt="Empower artists" />
            <h3>1. Empower every artist</h3>
            <p>
              We give creators a place where their work is visible, contextual
              and credit is crystal clear. Every project has an owner, co-leads
              and contributors—so everyone’s role is recognised.
            </p>
          </article>

          <article className="mission-card">
            <img src="/images/about/mission2.jpg" alt="Foster collaboration" />
            <h3>2. Make collaboration feel natural</h3>
            <p>
              Projects, shared media and feedback tools are designed so you can
              move from idea → draft → finished piece without drowning in chats
              or lost files. The platform acts like a shared studio wall.
            </p>
          </article>

          <article className="mission-card">
            <img src="/images/about/mission3.jpg" alt="Inspire growth" />
            <h3>3. Spark growth & experimentation</h3>
            <p>
              By connecting disciplines and perspectives, ArtCollab encourages
              unusual pairings and brave experiments. Each project becomes a
              learning space, not just a result to publish and forget.
            </p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="about-how">
        <div className="about-how-header">
          <h2>How ArtCollab works</h2>
          <p>
            Under the hood, ArtCollab is a simple but opinionated workflow for
            collaborative art. No complicated project management—just the
            essentials artists actually use.
          </p>
        </div>

        <div className="about-how-grid">
          <div className="about-how-step">
            <div className="about-step-badge">Step 1</div>
            <h3>Create a project</h3>
            <p>
              Start with a clear intention: a collaboration, a studio space or a
              solo portfolio. Set your disciplines, a short description and an
              optional deadline so everyone understands the frame.
            </p>
          </div>

          <div className="about-how-step">
            <div className="about-step-badge">Step 2</div>
            <h3>Invite collaborators</h3>
            <p>
              Add other ArtCollab users as co-owners or contributors. Everyone
              sees the same brief, media and milestones, so decisions and
              credits stay transparent.
            </p>
          </div>

          <div className="about-how-step">
            <div className="about-step-badge">Step 3</div>
            <h3>Build and share the work</h3>
            <p>
              Upload media, track progress, gather feedback and decide when a
              piece is ready to release. The project history stays as a record
              of how the work came to life.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="about-values">
        <div className="about-values-inner">
          <h2>What we care about</h2>
          <div className="about-values-grid">
            <div className="about-value-card">
              <h3>Respect for authorship</h3>
              <p>
                Ownership and credit are never an afterthought. Roles,
                contributions and visibility are part of the project structure
                from day one.
              </p>
            </div>
            <div className="about-value-card">
              <h3>Cross-disciplinary play</h3>
              <p>
                We design for hybrid projects: visual + sound, text + motion,
                live + digital. The platform doesn’t force you into a single
                medium.
              </p>
            </div>
            <div className="about-value-card">
              <h3>Community over metrics</h3>
              <p>
                Likes and views are signals, not the goal. ArtCollab focuses on
                collaboration, learning and process—not just chasing numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <h2>Ready to open your studio to the world?</h2>
          <p>
            Start a project, invite a couple of collaborators and see what
            happens when your ideas have more hands, eyes and ears on them.
          </p>
          <div className="about-cta-actions">
            <Link to="/projects/new" className="about-btn about-btn-primary">
              Start a project
            </Link>
            <Link to="/projects" className="about-btn about-btn-ghost">
              Browse collaborations
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
