/**
 * Suspense fallback for lazy routes. Lives in its own file so main.tsx stays a
 * pure route table — mixing a component definition in there trips the
 * react-refresh lint rule.
 */
export default function RouteFallback() {
  return (
    <div className="pg-page">
      <div className="st-card st-empty">
        <h3>Loading…</h3>
      </div>
    </div>
  );
}