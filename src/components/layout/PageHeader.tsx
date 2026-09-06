/**
 * Standard page header: title + description. All app pages use this —
 * hierarchy stays consistent without per-page styling drift.
 */
export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
  );
}
