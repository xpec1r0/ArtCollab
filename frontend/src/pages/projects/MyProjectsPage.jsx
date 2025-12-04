// src/pages/projects/MyProjectsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import ProjectCard from "../../components/project/ProjectCard.jsx";
import Button from "../../components/ui/Button.jsx";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Rows3,
} from "lucide-react";

import "./projects.css";

const PAGE_SIZE = 12;

/* ===== helpers iguales a ProjectsPage ===== */

function normalizeProjectList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.projects)) return payload.projects;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function getTotalPages(payload, pageSize = PAGE_SIZE) {
  if (!payload) return 1;

  if (payload.pagination?.totalPages) {
    return payload.pagination.totalPages;
  }

  if (typeof payload.totalPages === "number") return payload.totalPages;
  if (payload.meta?.totalPages) return payload.meta.totalPages;

  const totalFromPayload =
    typeof payload.pagination?.totalProjects === "number"
      ? payload.pagination.totalProjects
      : typeof payload.totalProjects === "number"
      ? payload.totalProjects
      : typeof payload.meta?.total === "number"
      ? payload.meta.total
      : typeof payload.total === "number"
      ? payload.total
      : typeof payload.count === "number"
      ? payload.count
      : null;

  if (typeof totalFromPayload === "number") {
    return Math.max(1, Math.ceil(totalFromPayload / pageSize));
  }

  return 1;
}

function deriveTotalProjects(payload, listLength) {
  if (!payload) return listLength;

  if (typeof payload.pagination?.totalProjects === "number") {
    return payload.pagination.totalProjects;
  }

  if (typeof payload.totalProjects === "number") return payload.totalProjects;
  if (typeof payload.meta?.total === "number") return payload.meta.total;
  if (typeof payload.total === "number") return payload.total;
  if (typeof payload.count === "number") return payload.count;

  return listLength;
}

/* ===== View toggle (grid / list) ===== */

function ViewModeToggle({ value, onChange }) {
  const isListView = value === "list";

  return (
    <div className="projects-view-toggle" aria-label="View mode toggle">
      <button
        type="button"
        className={`projects-view-toggle-btn ${
          !isListView ? "is-active" : ""
        }`}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="projects-view-toggle-icon" />
      </button>
      <button
        type="button"
        className={`projects-view-toggle-btn ${
          isListView ? "is-active" : ""
        }`}
        onClick={() => onChange("list")}
      >
        <Rows3 className="projects-view-toggle-icon" />
      </button>
    </div>
  );
}

/* ===== Página My Projects ===== */

function MyProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchMyProjects() {
      setLoading(true);
      setError(null);

      try {
        const ownerId = user?._id || user?.id;

        const params = {
          page,
          limit: PAGE_SIZE,
        };

        if (ownerId) {
          params.owner = ownerId;
        }

        const res = await api.get("/projects", { params });
        const payload = res.data;
        const list = normalizeProjectList(payload);

        if (!cancelled) {
          setProjects(list);
          setTotalPages(getTotalPages(payload, PAGE_SIZE));
          setTotalProjects(deriveTotalProjects(payload, list.length));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching my projects", err);
          if (axios.isAxiosError(err)) {
            setError(
              err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to load your projects. Please try again."
            );
          } else {
            setError("Unexpected error while loading your projects.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMyProjects();

    return () => {
      cancelled = true;
    };
  }, [user, page]);

  const currentResultsCount = projects.length;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const isListView = viewMode === "list";

  const [rangeStart, rangeEnd] = useMemo(() => {
    if (!totalProjects || currentResultsCount === 0) {
      return [0, 0];
    }

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = start + currentResultsCount - 1;
    return [start, Math.min(end, totalProjects)];
  }, [page, totalProjects, currentResultsCount]);

  return (
    <section className="projects-page art-page-background">
      <div className="projects-shell">
        <div className="projects-inner">
          {/* Panel superior, reutilizando estilos de projects */}
          <div className="projects-panel">
            <div className="projects-panel-inner">
              <header className="projects-header my-projects-header">
                <div>
                  <p className="projects-kicker">Workspace</p>
                  <h1 className="projects-title h-display">Your projects</h1>
                  <p className="projects-subtitle">
                    Projects you lead or own on ArtCollab. Start something new
                    or return to ongoing collaborations.
                  </p>
                </div>

                <div className="projects-header-meta">
                  {totalProjects > 0 ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/projects/new")}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        <span>Start a new project</span>
                      </Button>
                      <span className="projects-live-hint">
                        You currently own{" "}
                        <strong>{totalProjects}</strong> project
                        {totalProjects === 1 ? "" : "s"}.
                      </span>
                    </>
                  ) : (
                    <span className="projects-live-hint">
                      When you create your first project, it will appear in this
                      workspace.
                    </span>
                  )}
                </div>
              </header>

              {/* Resumen simple + acciones */}
              <div className="projects-results-bar">
                <div className="projects-results-summary">
                  {totalProjects > 0 && rangeStart > 0 ? (
                    <span>
                      Showing{" "}
                      <strong>
                        {rangeStart}–{rangeEnd}
                      </strong>{" "}
                      of <strong>{totalProjects}</strong> project
                      {totalProjects === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span>
                      You don&apos;t have any projects yet. Start one to see it
                      here.
                    </span>
                  )}
                </div>

                <div className="projects-actions">
                  <ViewModeToggle value={viewMode} onChange={setViewMode} />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/projects")}
                  >
                    Explore public projects
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido: grid + estados + paginación */}
          <div className="projects-content">
            {error && <div className="projects-error">{error}</div>}

            {loading && (
              <div
                className={
                  isListView
                    ? "projects-grid projects-grid--list"
                    : "projects-grid"
                }
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="projects-skeleton" />
                ))}
              </div>
            )}

            {!loading && !error && projects.length === 0 && (
              <div className="projects-empty">
                <p className="projects-empty-title">
                  You haven&apos;t started a project yet
                </p>
                <p className="projects-empty-text">
                  Create your first project to invite collaborators, share
                  references and track your progress together.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/projects/new")}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    <span>Create your first project</span>
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && projects.length > 0 && (
              <>
                <div
                  className={
                    isListView
                      ? "projects-grid projects-grid--list"
                      : "projects-grid"
                  }
                >
                  {projects.map((project) => (
                    <div
                      key={project._id || project.id}
                      className={isListView ? "projects-list-item" : ""}
                    >
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>

                <div className="projects-pagination">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="projects-pagination-controls">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canGoPrev || loading}
                      onClick={() => canGoPrev && setPage((p) => p - 1)}
                      className="projects-pagination-btn"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>Previous</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!canGoNext || loading}
                      onClick={() => canGoNext && setPage((p) => p + 1)}
                      className="projects-pagination-btn"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyProjectsPage;
