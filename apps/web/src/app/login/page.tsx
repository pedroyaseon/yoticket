"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";

const destinations: Record<string, string> = {
  ORGANIZER: "/organizer/events",
  CUSTOMER: "/events",
  GATE: "/gate",
};
const demoAccounts = [
  { label: "Cliente", email: "customer1@demo.com" },
  { label: "Organizador", email: "organizer@demo.com" },
  { label: "Portaria", email: "gate@demo.com" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("customer1@demo.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await api<{ accessToken: string; user: { role: string } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      localStorage.setItem("yoticket.token", result.accessToken);
      localStorage.setItem("yoticket.role", result.user.role);
      router.push(destinations[result.user.role] ?? "/events");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível entrar.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl lg:grid-cols-[.9fr_1.1fr]">
        <section className="hidden border-r border-[#29292d] bg-[#141416] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              ACESSO YOTICKET
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">
              Uma entrada para cada papel.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#9e9990]">
              Clientes compram ingressos, organizadores montam a programação e a
              portaria valida o acesso.
            </p>
          </div>
          <div className="border-l-2 border-[#ff5c35] pl-5">
            <p className="text-sm leading-6 text-[#aaa59c]">
              Ambiente de demonstração
            </p>
            <p className="mt-1 font-mono text-xs text-[#77736d]">
              Senha padrão: demo123
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              BEM-VINDO DE VOLTA
            </p>
            <h2 className="mt-4 text-4xl font-semibold">Entre na sua conta</h2>
            <p className="mt-3 text-[#9e9990]">
              Use seu e-mail e senha para continuar.
            </p>
            <form
              onSubmit={submit}
              className="mt-8 space-y-5"
              aria-busy={submitting}
            >
              <label className="block" htmlFor="email">
                <span className="mb-2 block text-sm text-[#bbb6ad]">
                  E-mail
                </span>
                <input
                  id="email"
                  required
                  value={email}
                  onChange={(input) => setEmail(input.target.value)}
                  type="email"
                  autoComplete="email"
                  className="w-full border border-[#39393e] bg-[#141416] p-3.5 outline-none focus:border-[#ff5c35]"
                />
              </label>
              <label className="block" htmlFor="password">
                <span className="mb-2 block text-sm text-[#bbb6ad]">Senha</span>
                <input
                  id="password"
                  required
                  value={password}
                  onChange={(input) => setPassword(input.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="w-full border border-[#39393e] bg-[#141416] p-3.5 outline-none focus:border-[#ff5c35]"
                />
              </label>
              <button
                disabled={submitting}
                className="w-full bg-[#ff5c35] p-3.5 font-semibold text-black hover:bg-[#ff7655] disabled:opacity-50"
              >
                {submitting ? "Entrando…" : "Entrar"}
              </button>
              {error && (
                <p
                  role="alert"
                  className="border border-red-400/30 bg-red-950/20 p-4 text-sm text-red-200"
                >
                  {error}
                </p>
              )}
            </form>
            <div className="mt-8 border-t border-[#29292d] pt-6">
              <p className="text-xs uppercase tracking-[.13em] text-[#77736d]">
                Preencher conta de demonstração
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword("demo123");
                      setError("");
                    }}
                    className="border border-[#39393e] px-3 py-2 text-xs text-[#bbb6ad] hover:border-[#ff5c35] hover:text-[#ff7a59]"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
