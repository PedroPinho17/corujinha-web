import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
  {
    variants: {
      variant: {
        blue: "bg-purple-100 text-purple",
        pink: "bg-pink text-white",
        orange: "bg-orange/10 text-orange",
        outline: "border border-ink/10 bg-white text-ink",
      },
    },
    defaultVariants: {
      variant: "pink",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
