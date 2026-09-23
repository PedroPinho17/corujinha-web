"use client";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">Algo correu mal</h1>
      <p className="mt-3 text-muted">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted/70">Ref: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-pink px-6 py-2.5 font-medium text-white hover:bg-pink-dark"
      >
        Tentar de novo
      </button>
    </div>
  );
}
