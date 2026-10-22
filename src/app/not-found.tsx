/* Unknown server paths. Studio views live under hash routes, so this mostly
   catches typos and stale links — it stays calm and points back in. */
export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-6">
      <div className="text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-signal">
          404
        </p>
        <h1 className="h2 mt-2 text-ink">This page was never published</h1>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-ink-2">
          The link is dead or the address is mistyped. Your account is exactly
          where you left it.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a
            href="/"
            className="inline-flex h-10 shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md bg-signal px-5 text-[13.5px] font-semibold text-signal-ink shadow-[var(--sh-1)] transition-[background-color,transform] duration-150 ease-out hover:bg-signal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal active:translate-y-px"
          >
            Back to RELO
          </a>
        </div>
      </div>
    </main>
  );
}
