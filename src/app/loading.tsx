'use client';

import { Logo } from "@/components/relo/chrome";

/* First paint of the tree: one quiet pulse on paper, no skeleton library.
   Client component because Logo is a client primitive; the surrounding
   layout stays as server-rendered as the rest of the tree. */
export default function Loading() {
  return (
    <main className="grid min-h-svh place-items-center bg-canvas" aria-busy="true">
      <span className="animate-pulse" role="status" aria-label="Loading RELO">
        <Logo />
      </span>
    </main>
  );
}
