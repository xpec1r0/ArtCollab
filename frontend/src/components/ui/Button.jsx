import React, { forwardRef } from "react";

// pequeñito helper para clases
const cn = (...classes) => classes.filter(Boolean).join(" ");

const Button = forwardRef(
  (
    {
      children,
      variant = "primary", // primary | outline | ghost | subtle | link
      size = "md",         // sm | md | lg | icon
      fullWidth = false,
      isLoading = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-tr from-orange-400 to-pink-500 text-slate-950 shadow-[0_12px_25px_rgba(248,113,113,0.55)] hover:shadow-[0_16px_30px_rgba(248,113,113,0.65)] hover:-translate-y-0.5 border border-slate-900/20",
      outline:
        "border border-slate-500/70 text-slate-100 bg-transparent hover:bg-slate-900/60",
      ghost:
        "text-slate-100 hover:bg-slate-800/60 border border-transparent",
      subtle:
        "bg-slate-800/80 text-slate-100 border border-slate-700 hover:bg-slate-800",
      link: "bg-transparent border border-transparent text-indigo-400 hover:text-indigo-300 hover:underline rounded-none px-0",
    };

    const lightVariants = {
      primary:
        "bg-gradient-to-tr from-orange-400 to-pink-500 text-slate-950 shadow-[0_8px_18px_rgba(248,113,113,0.45)] hover:shadow-[0_12px_22px_rgba(248,113,113,0.55)] hover:-translate-y-0.5 border border-slate-900/10",
      outline:
        "border border-slate-300 text-slate-900 bg-slate-50 hover:bg-slate-100",
      ghost:
        "text-slate-800 hover:bg-slate-100 border border-transparent",
      subtle:
        "bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200",
      link: "bg-transparent border border-transparent text-indigo-600 hover:text-indigo-500 hover:underline rounded-none px-0",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5",
      md: "text-sm px-4 py-2",
      lg: "text-sm px-5 py-2.5",
      icon: "h-9 w-9 p-0 rounded-full",
    };

    const isLight =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "light";

    const palette = isLight ? lightVariants : variants;

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          base,
          palette[variant] || palette.primary,
          sizes[size] || sizes.md,
          fullWidth && "w-full justify-center",
          isDisabled && "opacity-70",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <span
            className={cn(
              "inline-block h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin",
              variant === "primary" && "border-slate-100 border-t-transparent"
            )}
          />
        )}
        <span className={isLoading ? "opacity-0" : "opacity-100"}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button };
