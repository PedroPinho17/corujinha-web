function friendlyHttpError(status: number, text: string): string {
  if (status === 429) return "Demasiados pedidos. Aguarde um pouco e tente novamente.";
  if (status === 401 || status === 403) return "Sessão expirada ou sem permissão. Entre novamente.";
  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    const msg = Array.isArray(parsed.message) ? parsed.message.join("; ") : parsed.message;
    if (msg) {
      const lower = msg.toLowerCase();
      if (lower.includes("email must be an email") || lower.includes("email inválido")) {
        return "O email indicado não é válido. Deixe o campo vazio se não precisar.";
      }
      if (lower.includes("should not exist") || lower.includes("property") || lower.includes("whitelist")) {
        return "Dados inválidos ao guardar. Atualize a página e tente novamente.";
      }
      if (lower.includes("internal server error")) return "Erro no servidor. Tente novamente dentro de momentos.";
      return msg;
    }
  } catch {
    /* not JSON */
  }
  if (status === 400) return "Pedido inválido. Verifique os campos e tente novamente.";
  return text || `Erro HTTP ${status}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(friendlyHttpError(res.status, text));
  }
  return res.json() as Promise<T>;
}

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, init);
}

export async function uploadImage(file: File, folder = "uploads") {
  const contentType = file.type || "image/jpeg";
  const size = file.size;
  const { key, uploadUrl, publicUrl } = await adminFetch<{
    key: string;
    uploadUrl: string;
    publicUrl: string;
  }>("/api/admin/media/presign", {
    method: "POST",
    body: JSON.stringify({ contentType, folder, size }),
  });
  // Browser sets Content-Length from the body (forbidden to set manually); must match signed size.
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed");
  return { key, publicUrl };
}

