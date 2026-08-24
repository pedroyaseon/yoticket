import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#29292d] bg-[#0b0b0c]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-sm text-[#8f8a82] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>YoTicket — bilheteria digital para sessões inesquecíveis.</p>
        <div className="flex gap-5">
          <Link href="/events" className="hover:text-[#ff5c35]">
            Eventos
          </Link>
          <Link href="/login" className="hover:text-[#ff5c35]">
            Acessar
          </Link>
        </div>
      </div>
    </footer>
  );
}
