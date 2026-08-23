"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
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
      if (result.user.role !== "ORGANIZER")
        throw new Error("Use uma conta de organizador para esta área.");
      localStorage.setItem("yoticket.token", result.accessToken);
      router.push("/organizer/events");
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
        <h1 className="text-3xl font-semibold">Área do organizador</h1>
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
