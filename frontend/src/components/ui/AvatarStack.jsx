// src/components/ui/AvatarStack.jsx
import React from "react";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}

function AvatarCircle({ name, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Artist avatar"}
        className="h-7 w-7 rounded-full border border-slate-900 object-cover"
      />
    );
  }

  return (
    <div className="h-7 w-7 rounded-full border border-slate-900 bg-slate-700/80 text-[10px] font-semibold flex items-center justify-center text-slate-100">
      {getInitials(name)}
    </div>
  );
}

function AvatarStack({ owner, collaborators = [], max = 3 }) {
  const visible = [owner, ...collaborators].filter(Boolean).slice(0, max);
  const total = [owner, ...collaborators].filter(Boolean).length;
  const extra = Math.max(0, total - visible.length);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {visible.map((person, index) => (
          <div
            key={person.id || person.username || person.name || index}
            className="inline-flex rounded-full border border-slate-900/80 bg-slate-900"
          >
            <AvatarCircle
              name={person.name || person.username}
              avatarUrl={person.avatarUrl}
            />
          </div>
        ))}
        {extra > 0 && (
          <div className="h-7 w-7 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-300">
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarStack;
