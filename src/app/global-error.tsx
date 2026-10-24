"use client";

/* Last resort: replaces the root html/body when the layout itself fails.
   It cannot import the token stylesheet… but it can inline the two colours
   it needs, copied from `globals.css` (update there first if you tune these).
   Rendered in the dark default since the deep navy theme is the product's base. */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#050b18",
          color: "#eaf2ff",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "26rem",
            width: "100%",
            padding: "2rem",
            textAlign: "center",
            background: "#0b1526",
            border: "1px solid #1d2f47",
            borderRadius: "12px",
          }}
        >
          <h1 style={{ fontSize: "1.4rem", margin: "0 0 0.5rem" }}>
            Something broke on our side
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              lineHeight: 1.6,
              color: "#a4b6ce",
              margin: 0,
            }}
          >
            The app failed to load. Try again — if it persists, the details in
            your browser console help us fix it fast.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "8px",
              border: "1px solid transparent",
              background: "#22d3ee",
              color: "#04121f",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
