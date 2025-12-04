// src/pages/projects/ProjectsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { api } from "../../api/client";
import ProjectCard from "../../components/project/ProjectCard.jsx";
import TextField from "../../components/ui/TextField.jsx";
import Button from "../../components/ui/Button.jsx";
import {
  Funnel,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Rows3,
  ChevronDown,
  Check,
} from "lucide-react";

import "./projects.css";

const PAGE_SIZE = 12;

// Deben coincidir con enum del backend (Project.category)
const CATEGORY_OPTIONS = [
  { value: "all", label: "All disciplines" },
  { value: "digital_art", label: "Digital art" },
  { value: "illustration", label: "Illustration" },
  { value: "photography", label: "Photography" },
  { value: "storytelling", label: "Storytelling / writing" },
  { value: "music", label: "Music & sound" },
  { value: "performance", label: "Performance" },
  { value: "design", label: "Design" },
  { value: "mixed_media", label: "Mixed media" },
  { value: "sculpture", label: "Sculpture" },
  { value: "other", label: "Other" },
];

// Deben coincidir con enum del backend (Project.projectType)
const TYPE_OPTIONS = [
  { value: "all", label: "All project types" },
  { value: "solo", label: "Solo" },
  { value: "collaboration", label: "Collaboration" },
  { value: "commission", label: "Commission" },
  { value: "contest", label: "Contest" },
];

// Deben coincidir con enum del backend (Project.status)
const STATUS_OPTIONS = [
  { value: "all", label: "Any status" },
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "-views", label: "Most viewed" },
  { value: "-likes", label: "Most liked" },
];

/* ===========================
   Util helpers
   =========================== */

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

/* ===========================
   UI: Select reutilizable
   =========================== */

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  isOpen,
  onToggle,
}) {
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  const handleOptionClick = (optValue) => {
    if (optValue !== value) {
      onChange(optValue);
    }
    onToggle?.();
  };

  return (
    <div className="projects-select-group">
      {label && (
        <label htmlFor={id} className="projects-field-label">
          {label}
        </label>
      )}

      <div className={`projects-select-root ${isOpen ? "is-open" : ""}`}>
        <button
          id={id}
          type="button"
          className="projects-select-trigger"
          onClick={onToggle}
        >
          <span className="projects-select-trigger-label">
            {selectedOption?.label}
          </span>
          <ChevronDown
            className="projects-select-trigger-icon"
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <ul
            className="projects-select-options"
            role="listbox"
            aria-labelledby={id}
          >
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  className={[
                    "projects-select-option",
                    selected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleOptionClick(opt.value)}
                >
                  <span className="projects-select-option-label">
                    {opt.label}
                  </span>
                  {selected && (
                    <Check
                      className="projects-select-option-check"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ===========================
   UI: Toggle grid / list
   =========================== */

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

/* ===========================
   Página principal
   =========================== */

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);

  // searchInput = lo que escribe el usuario
  // search = valor realmente enviado al backend (debounced + trim)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("-createdAt");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  // cuál select está abierto ahora
  const [openFilterId, setOpenFilterId] = useState(null);

  /* ===========================
     Cerrar selects al hacer click fuera
     =========================== */
  useEffect(() => {
    if (!openFilterId) return;

    function handleClickOutside(event) {
      if (!event.target.closest(".projects-filters")) {
        setOpenFilterId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openFilterId]);

  /* ===========================
     Debounce del search
     =========================== */
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch((prev) => {
        if (prev === trimmed) {
          return prev;
        }
        // solo cuando cambia de verdad reseteamos página
        setPage(1);
        return trimmed;
      });
    }, 450); // 400-500ms es un buen sweet spot

    return () => clearTimeout(handler);
  }, [searchInput]);

  /* ===========================
     Fetch de proyectos con AbortController
     =========================== */
  useEffect(() => {
    const controller = new AbortController();
    let didCancel = false;

    async function fetchProjects() {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: PAGE_SIZE,
        };

        if (search) params.q = search;
        if (category !== "all") params.category = category;
        if (projectType !== "all") params.projectType = projectType;
        if (statusFilter !== "all") params.status = statusFilter;
        if (sort) params.sort = sort;

        const res = await api.get("/projects", {
          params,
          signal: controller.signal,
        });

        const payload = res.data;
        const list = normalizeProjectList(payload);

        if (!didCancel) {
          setProjects(list);
          setTotalPages(getTotalPages(payload, PAGE_SIZE));
          setTotalProjects(deriveTotalProjects(payload, list.length));
        }
      } catch (err) {
        if (didCancel) return;
        if (axios.isCancel(err)) return;

        console.error("Error fetching projects", err);

        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const data = err.response?.data;

          if (status === 429) {
            setError(
              "Too many requests. Please slow down a bit before searching again."
            );
          } else if (status === 400 && data?.error === "Validation failed") {
            const firstDetail = Array.isArray(data.details)
              ? data.details[0]?.message
              : null;
            setError(
              firstDetail ||
                "Some filters are invalid. Try a shorter search or clear filters."
            );
          } else {
            setError(
              data?.error ||
                data?.message ||
                "Unable to load projects. Please try again."
            );
          }
        } else {
          setError("Unexpected error while loading projects.");
        }
      } finally {
        if (!didCancel) {
          setLoading(false);
        }
      }
    }

    fetchProjects();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [page, search, category, projectType, statusFilter, sort]);

  const handleApplyFilters = (event) => {
    if (event) event.preventDefault();
    // filtros ya son "live"; aseguramos que arrancamos en página 1
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("all");
    setProjectType("all");
    setStatusFilter("all");
    setSort("-createdAt");
    setPage(1);
    setOpenFilterId(null);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const hasActiveFilters =
    search ||
    category !== "all" ||
    projectType !== "all" ||
    statusFilter !== "all" ||
    sort !== "-createdAt";

  const currentResultsCount = projects.length;

  const categoryLabel =
    CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label || null;
  const typeLabel =
    TYPE_OPTIONS.find((opt) => opt.value === projectType)?.label || null;
  const statusLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label || null;

  const [rangeStart, rangeEnd] = useMemo(() => {
    if (!totalProjects || currentResultsCount === 0) {
      return [0, 0];
    }

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = start + currentResultsCount - 1;

    return [start, Math.min(end, totalProjects)];
  }, [page, totalProjects, currentResultsCount]);

  const isListView = viewMode === "list";

  // helper para abrir/cerrar selects con un solo click
  const makeToggleFilter = (id) => () => {
    setOpenFilterId((current) => (current === id ? null : id));
  };

  return (
    <section className="projects-page art-page-background">
      <div className="projects-shell">
        <div className="projects-inner">
          {/* Panel principal glass */}
          <div className="projects-panel">
            <div className="projects-panel-inner">
              {/* Header */}
              <header className="projects-header">
                <div>
                  <p className="projects-kicker">Discover projects</p>
                  <h1 className="projects-title h-display">
                    Explore collaborative art projects
                  </h1>
                  <p className="projects-subtitle">
                    Browse public projects across disciplines &mdash; digital,
                    illustration, performance, writing and more. Join, support
                    or simply get inspired by ongoing collaborations.
                  </p>
                </div>

                <div className="projects-header-meta">
                  <div className="projects-live-pill">
                    <Funnel className="projects-live-icon" />
                    <span className="projects-live-label">Live filters</span>
                  </div>
                  <span className="projects-live-hint">
                    Results update as you type. Reset everything with a single
                    click if you get lost.
                  </span>
                </div>
              </header>

              {/* Filtros */}
              <form onSubmit={handleApplyFilters} className="projects-filters">
                {/* Fila: buscador + bloque de filtros */}
                <div className="projects-filters-row">
                  <div className="projects-search-col">
                    <label
                      htmlFor="projects-search"
                      className="projects-field-label projects-search-label"
                    >
                      Search
                    </label>

                    <div className="projects-search-shell">
                      <TextField
                        id="projects-search"
                        value={searchInput}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 80); // límite duro < max backend (100)
                          setSearchInput(value);
                        }}
                        placeholder="Search by title, tag or artist"
                        autoComplete="off"
                        variant="bare"
                        className="projects-search-input"
                        rightElement={
                          <Search className="h-3.5 w-3.5 text-slate-500" />
                        }
                      />
                    </div>
                  </div>

                  <div className="projects-inline-filters">
                    <FilterSelect
                      id="projects-category"
                      label="Category"
                      value={category}
                      onChange={(val) => {
                        setCategory(val);
                        setPage(1);
                      }}
                      options={CATEGORY_OPTIONS}
                      isOpen={openFilterId === "projects-category"}
                      onToggle={makeToggleFilter("projects-category")}
                    />

                    <FilterSelect
                      id="projects-type"
                      label="Project type"
                      value={projectType}
                      onChange={(val) => {
                        setProjectType(val);
                        setPage(1);
                      }}
                      options={TYPE_OPTIONS}
                      isOpen={openFilterId === "projects-type"}
                      onToggle={makeToggleFilter("projects-type")}
                    />

                    <FilterSelect
                      id="projects-status"
                      label="Status"
                      value={statusFilter}
                      onChange={(val) => {
                        setStatusFilter(val);
                        setPage(1);
                      }}
                      options={STATUS_OPTIONS}
                      isOpen={openFilterId === "projects-status"}
                      onToggle={makeToggleFilter("projects-status")}
                    />

                    <FilterSelect
                      id="projects-sort"
                      label="Sort by"
                      value={sort}
                      onChange={(val) => {
                        setSort(val);
                        setPage(1);
                      }}
                      options={SORT_OPTIONS}
                      isOpen={openFilterId === "projects-sort"}
                      onToggle={makeToggleFilter("projects-sort")}
                    />
                  </div>
                </div>

                {/* Barra de resultados + chips + acciones */}
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
                        Showing <strong>{currentResultsCount}</strong> project
                        {currentResultsCount === 1 ? "" : "s"} on page{" "}
                        <strong>{page}</strong> of <strong>{totalPages}</strong>
                        .
                      </span>
                    )}
                  </div>

                  {hasActiveFilters && (
                    <div className="projects-active-filters">
                      <span className="projects-chip">
                        <span className="projects-chip-dot" />
                        Filters active
                      </span>
                      {search && (
                        <span className="projects-chip">
                          Search: “{search}”
                        </span>
                      )}
                      {category !== "all" && categoryLabel && (
                        <span className="projects-chip">
                          Category: {categoryLabel}
                        </span>
                      )}
                      {projectType !== "all" && typeLabel && (
                        <span className="projects-chip">
                          Type: {typeLabel}
                        </span>
                      )}
                      {statusFilter !== "all" && statusLabel && (
                        <span className="projects-chip">
                          Status: {statusLabel}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="projects-actions">
                    <ViewModeToggle
                      value={viewMode}
                      onChange={setViewMode}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                    <Button type="submit" variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </div>
              </form>
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
                <p className="projects-empty-title">No projects found</p>
                <p className="projects-empty-text">
                  Try adjusting the filters or search terms. Once projects are
                  created, they will appear here for artists to explore.
                </p>
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

                {/* Pagination */}
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

export default ProjectsPage;
