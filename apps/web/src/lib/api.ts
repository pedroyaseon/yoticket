const baseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
).replace(/\/$/, "");

export async function api<T>(path: string, init: RequestInit = {}) {
  const token =
    typeof window === "undefined"
      ? null
      : localStorage.getItem("yoticket.token");
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new Error(
      "A API do YoTicket está indisponível. Verifique se o servidor está em execução.",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const rawMessage = Array.isArray(body.message)
      ? body.message[0]
      : body.message;
    const message =
      response.status === 401
        ? "Entre com sua conta para continuar."
        : response.status === 403
          ? "Sua conta não tem permissão para realizar esta ação."
          : rawMessage;
    throw new Error(
      message ?? `Não foi possível concluir a ação (${response.status}).`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
