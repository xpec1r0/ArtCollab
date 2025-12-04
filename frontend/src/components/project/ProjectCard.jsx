import React from "react";
import { Heart, Users, Eye, Star } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import TagPill from "../ui/TagPill.jsx";
import AvatarStack from "../ui/AvatarStack.jsx";

const typeToBadgeVariant = {
  solo: "info",
  collaboration: "success",
  collab: "success",
  commission: "warning",
  contest: "danger",
};

const statusToBadgeVariant = {
  planning: "info",
  active: "success",
  on_hold: "warning",
  completed: "success",
  cancelled: "danger",
};

const CATEGORY_LABELS = {
  painting: "Painting",
  music: "Music",
  design: "Design",
  illustration: "Illustration",
  storytelling: "Storytelling / writing",
  photography: "Photography",
  sculpture: "Sculpture",
  digital_art: "Digital art",
  mixed_media: "Mixed media",
  other: "Other",
};

function ProjectCard({ project, variant = "grid" }) {
  const {
    title,
    category,
    projectType,
    status,
    owner,
    participants = [],
    tags = [],
    coverImageUrl,
    isFeatured,
  } = project;

  // Derivar likes / views desde distintas formas que puede traer el backend
  const likeCount =
    project.likeCount ??
    (Array.isArray(project.likes) ? project.likes.length : undefined) ??
    project.likesCount ??
    0;

  const views =
    typeof project.views === "number"
      ? project.views
      : typeof project.viewsCount === "number"
      ? project.viewsCount
      : 0;

  // Cover: usar coverImageUrl o intentar sacar algo del array de media si existe
  let resolvedCover = coverImageUrl || null;
  if (!resolvedCover && Array.isArray(project.media) && project.media.length) {
    const primary =
      project.media.find((m) => m.role === "primary") || project.media[0];
    const mediaItem = primary?.mediaItem || primary;
    resolvedCover =
      mediaItem?.thumbnailUrl || mediaItem?.cloudUrl || resolvedCover;
  }

  const typeKey =
    typeof projectType === "string"
      ? projectType.toLowerCase()
      : projectType || "";
  const typeVariant = typeToBadgeVariant[typeKey] ?? "neutral";

  const statusKey =
    typeof status === "string" ? status.toLowerCase() : status || "";
  const statusVariant = statusToBadgeVariant[statusKey] ?? "info";

  const rawCategory =
    typeof category === "string" ? category.toLowerCase() : category;
  const categoryLabel =
    CATEGORY_LABELS[rawCategory] || category || "Uncategorized";

  const mainTag = Array.isArray(tags) && tags.length > 0 ? tags[0] : null;
  const extraTags =
    Array.isArray(tags) && tags.length > 1 ? tags.slice(1, 3) : [];

  const ownerDisplay =
    owner?.displayName ||
    (owner?.firstName && owner?.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : null) ||
    owner?.username ||
    owner?.name ||
    "Unknown artist";

  const collaboratorCount = (participants?.length || 0) + 1;

  const isListVariant = variant === "list";

  return (
    <article
      className={[
        "group relative flex flex-col overflow-hidden",
        "rounded-[24px] border border-[var(--ac-border-subtle)]",
        "bg-[var(--ac-surface-soft)] shadow-[0_22px_60px_rgba(5,8,22,0.95)]",
        "transition-transform duration-200",
        "hover:-translate-y-[3px] hover:shadow-[0_30px_70px_rgba(5,8,22,0.95)]",
        "hover:border-[rgba(242,174,70,0.9)]",
        isListVariant ? "md:flex-row" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Cover */}
      <div
        className={[
          "relative overflow-hidden",
          isListVariant ? "md:w-2/5 lg:w-5/12 h-40 md:h-auto" : "h-40 md:h-44",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {resolvedCover ? (
          <img
            src={resolvedCover}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_0_0,rgba(242,174,70,0.28)_0,transparent_55%),radial-gradient(circle_at_100%_100%,rgba(79,70,229,0.3)_0,transparent_55%),linear-gradient(135deg,#020617,#111827)]" />
        )}

        {/* Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/0" />

        {/* Badges */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={typeVariant}>
              {projectType || "Project"}
            </Badge>
            {status && (
              <Badge variant={statusVariant}>
                {statusKey === "on_hold"
                  ? "On hold"
                  : statusKey === "completed"
                  ? "Completed"
                  : status}
              </Badge>
            )}
          </div>

          {isFeatured && (
            <div className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-300 backdrop-blur">
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              <span>Featured</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className={[
          "flex flex-1 flex-col",
          isListVariant ? "px-3.5 py-3.5 md:px-4 md:py-3.5" : "px-3.5 pt-3 pb-3.5",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[color:var(--ac-text-main)] text-sm md:text-base font-semibold leading-snug line-clamp-2">
              {title}
            </h3>
          </div>

          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ac-text-muted)]">
            {categoryLabel}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {mainTag && <TagPill label={mainTag} />}
            {extraTags.map((tag) => (
              <TagPill key={tag} label={tag} className="opacity-80" />
            ))}
          </div>
        </header>

        {/* Footer */}
        <footer className="mt-3 flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <AvatarStack owner={owner} collaborators={participants} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium text-[color:var(--ac-text-main)]">
                {ownerDisplay}
              </span>
              <span className="text-[10px] text-[color:var(--ac-text-muted)]">
                {collaboratorCount}{" "}
                {collaboratorCount === 1 ? "collaborator" : "collaborators"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-[11px] text-[color:var(--ac-text-muted)]">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-fuchsia-300" />
              <span>{likeCount}</span>
              <Users className="ml-2 h-3.5 w-3.5 text-cyan-300" />
              <span>{collaboratorCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--ac-text-muted)]/80">
              <Eye className="h-3 w-3" />
              <span>{views} views</span>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default ProjectCard;
