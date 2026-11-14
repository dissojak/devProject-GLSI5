import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/class-names";

const BUTTON_BASE =
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full font-display transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40 disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none";

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3.5 py-1.5 text-body-sm",
  md: "gap-2 px-5 py-2.5 text-body-md",
  lg: "gap-2.5 px-7 py-3.5 text-body-lg",
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ice font-bold text-navy shadow-lg shadow-ice/20 hover:bg-ice-bright",
  champagne:
    "border border-champagne/60 bg-champagne/5 font-semibold text-champagne hover:border-champagne hover:bg-champagne/15",
  teal: "border border-teal/70 bg-teal/5 font-medium text-foam hover:border-teal hover:bg-teal/15",
  crimson: "border border-crimson bg-crimson font-bold text-abyss shadow-lg shadow-crimson/30 hover:bg-rose",
  danger:
    "border border-crimson/50 bg-crimson/10 font-semibold text-crimson hover:border-crimson hover:bg-crimson/20",
  mint: "border border-mint bg-mint/15 font-bold text-mint hover:bg-mint/25",
};

export type ButtonVariant = "primary" | "champagne" | "teal" | "crimson" | "danger" | "mint";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function buttonClass(
  variant: ButtonVariant = "primary",
  className?: string,
  size: ButtonSize = "md",
): string {
  return cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className);
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className, size)} {...rest} />;
}
