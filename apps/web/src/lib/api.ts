const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
export async function api<T>(path: string, init: RequestInit = {}) {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('yoticket.token');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(Array.isArray(body.message) ? body.message[0] : body.message ?? 'Não foi possível concluir a ação.'); }
  return response.json() as Promise<T>;
}
