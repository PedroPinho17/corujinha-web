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
    throw new Error(text || `HTTP ${res.status}`);
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
  const { key, uploadUrl, publicUrl } = await adminFetch<{
    key: string;
    uploadUrl: string;
    publicUrl: string;
  }>("/api/admin/media/presign", {
    method: "POST",
    body: JSON.stringify({ contentType, folder }),
  });
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed");
  return { key, publicUrl };
}

