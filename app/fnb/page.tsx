export default function FnbHomePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600/15 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
          F&amp;B Control Terminal
        </h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Select an option from the side menu to get started —
          manage recipes, run inventory, view reports, or message other departments.
        </p>
        <p className="text-xs text-emerald-500/80">
          Union Hospitality · Inventory System
        </p>
      </div>
    </div>
  )
}
