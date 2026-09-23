import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  badge?: string;
  badgeVariant?: "blue" | "pink" | "orange";
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
  centered?: boolean;
};

export function SectionHeader({
  badge,
  badgeVariant = "blue",
  title,
  subtitle,
  className,
  centered = true,
}: Props) {
  return (
    <div className={cn(centered ? "text-center" : "text-left", className)}>
      {badge && (
        <Badge variant={badgeVariant} className="mb-4">
          <MegaphoneIcon />
          {badge}
        </Badge>
      )}
      <h2 className="text-4xl font-bold text-ink md:text-5xl">{title}</h2>
      {subtitle && (
        <p className={cn("mt-4 text-xl text-muted", centered && "mx-auto max-w-3xl")}>{subtitle}</p>
      )}
    </div>
  );
}

function MegaphoneIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
      />
    </svg>
  );
}
