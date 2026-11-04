import type { ReactNode } from "react";

export function GradientWord({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-pink to-orange bg-clip-text text-transparent">{children}</span>
  );
}

/** Page title (h1) shared by the inner public pages. */
export function PageHeading({
  title,
  accent,
  subtitle,
}: {
  title: string;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
        {title} <GradientWord>{accent}</GradientWord>
      </h1>
      {subtitle ? (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted md:text-xl">{subtitle}</p>
      ) : null}
    </div>
  );
}
