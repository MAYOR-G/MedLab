import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-surface-subtle text-text-secondary border border-border",
        primary:
          "bg-primary-tint text-primary border border-blue-200",
        success:
          "bg-semantic-success-bg text-semantic-success-text border border-semantic-success-border",
        info:
          "bg-semantic-info-bg text-semantic-info-text border border-semantic-info-border",
        warning:
          "bg-semantic-warning-bg text-semantic-warning-text border border-semantic-warning-border",
        destructive:
          "bg-semantic-error-bg text-semantic-error-text border border-semantic-error-border",
        ai:
          "bg-ai-bg text-ai-label border border-ai-border",
        outline:
          "text-text-primary border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
