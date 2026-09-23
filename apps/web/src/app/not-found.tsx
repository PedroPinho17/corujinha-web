import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="pt">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-pink-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Página não encontrada</h1>
        <p className="mt-3 text-gray-600">O endereço pode ter mudado ou já não existe.</p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-pink-600 px-6 py-2.5 font-medium text-white hover:bg-pink-700"
        >
          Voltar ao início
        </Link>
      </body>
    </html>
  );
}
