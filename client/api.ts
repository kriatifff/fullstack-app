const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const apiGetState = () => request<any | null>("/api/state");
export const apiSaveState = (state: any) =>
  request<any>("/api/state", { method: "POST", body: JSON.stringify(state) });
