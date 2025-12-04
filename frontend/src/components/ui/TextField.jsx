import React from "react";

function TextField({
  id,
  label,
  type = "text",
  error,
  rightElement,
  leftElement,
  helperText,
  variant = "default",
  className = "",
  ...rest
}) {
  const wrapperClasses = `flex w-full flex-col gap-1.5 ${className}`;

  const baseField =
    "flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] " +
    "transition-all duration-150";

  const defaultField =
    "border bg-[var(--ac-surface-soft)] text-[color:var(--ac-text-main)] " +
    (error
      ? "border-rose-500/80 focus-within:border-rose-400 focus-within:ring-1 focus-within:ring-rose-400/80"
      : "border-[var(--ac-border-subtle)] focus-within:border-[var(--ac-accent-primary)] focus-within:ring-1 focus-within:ring-[var(--ac-accent-primary-soft)]");

  const bareField =
    "border-none bg-transparent text-[color:var(--ac-text-main)] shadow-none px-1.5 py-2";

  const fieldClasses =
    baseField + " " + (variant === "bare" ? bareField : defaultField);

  return (
    <div className={wrapperClasses}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ac-text-muted)]"
        >
          {label}
        </label>
      )}

      <div className={fieldClasses}>
        {leftElement && (
          <div className="flex items-center gap-1 pr-2 border-r border-[var(--ac-border-subtle)] text-[color:var(--ac-text-muted)]">
            {leftElement}
          </div>
        )}

        <input
          id={id}
          type={type}
          className="flex-1 bg-transparent outline-none placeholder:text-[color:var(--ac-text-muted)]/80 text-[13px]"
          aria-invalid={!!error}
          {...rest}
        />

        {rightElement && (
          <div className="flex items-center gap-1 pl-2 border-l border-[var(--ac-border-subtle)] text-[color:var(--ac-text-muted)]">
            {rightElement}
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p
          className={`text-[11px] ${
            error ? "text-rose-300" : "text-[color:var(--ac-text-muted)]"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default TextField;
