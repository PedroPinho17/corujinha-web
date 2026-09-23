import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-pink">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Página não encontrada</h1>
      <p className="mt-3 text-muted">O endereço pode ter mudado ou já não existe.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-pink px-6 py-2.5 font-medium text-white hover:bg-pink-dark"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
