"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

const destinations: Record<string, string> = {
  ORGANIZER: "/organizer/events",
  CUSTOMER: "/events",
  GATE: "/gate",
};

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      const result = await api<{ accessToken: string; user: { role: string } }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: data.get("email"),
            password: data.get("password"),
          }),
        },
      );
      localStorage.setItem("yoticket.token", result.accessToken);
      localStorage.setItem("yoticket.role", result.user.role);
      router.push(destinations[result.user.role] ?? "/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form
        onSubmit={submit}
        className="w-full space-y-5 border border-[#3d3932] bg-[#201e1a] p-7"
      >
        <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">
          YOTICKET / ACESSO
        </p>
        <h1 className="text-3xl font-semibold">Entre na sua sessão</h1>
        <p className="text-sm text-[#bdb5a8]">
          Organizadores, clientes e portaria usam o mesmo acesso.
        </p>
        <input
          required
          name="email"
          type="email"
          placeholder="E-mail"
          className="w-full border border-[#514b41] bg-transparent p-3"
        />
        <input
          required
          name="password"
          type="password"
          placeholder="Senha"
          className="w-full border border-[#514b41] bg-transparent p-3"
        />
        <button className="w-full bg-[#e76732] p-3 font-semibold text-[#151412]">
          Entrar
        </button>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </form>
    </main>
  );
}
