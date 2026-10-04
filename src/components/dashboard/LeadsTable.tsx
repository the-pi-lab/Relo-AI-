import React, { useState } from "react";
import {
  Search,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Mail,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CapturedLead } from "@/types/contracts";

interface LeadsTableProps {
  leads: CapturedLead[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onSearch: (query: string | undefined, page?: number) => void;
  onExportCsv: () => Promise<void>;
}

export default function LeadsTable({
  leads,
  total,
  page,
  pageSize,
  isLoading,
  onSearch,
  onExportCsv,
}: LeadsTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(total, (page + 1) * pageSize);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim() || undefined, 0);
  };

  const handleExport = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      await onExportCsv();
    } catch {
      setExportError("The export failed — your session may have expired. Refresh and try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const goPage = (nextPage: number) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, nextPage));
    if (clamped !== page) onSearch(searchInput.trim() || undefined, clamped);
  };

  return (
    <div className="st-card" style={{ overflow: "hidden" }}>
      {/* header controls */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1.5px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.01em" }}>
                Captured Leads
              </h3>
              <span
                className="st-chip st-chip--email"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {total.toLocaleString()} contacts
              </span>
            </div>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-faint)", marginTop: 3 }}>
              100% creator-owned database. Zero contact tax, zero platform lock-in.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <form onSubmit={handleSearchSubmit} style={{ position: "relative", flex: "1 1 220px" }}>
              <Search
                style={{
                  width: 14,
                  height: 14,
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)",
                }}
                aria-hidden
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search username or email…"
                aria-label="Search leads by username or email"
                style={{
                  width: "100%",
                  minHeight: 36,
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface-2)",
                  padding: "0 12px 0 34px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text)",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </form>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || total === 0}
              className="st-btn st-btn--primary st-btn--sm st-btn--sheen"
            >
              {isExporting ? (
                <RefreshCw style={{ animation: "spin 1.2s linear infinite" }} aria-hidden />
              ) : (
                <Download aria-hidden />
              )}
              Export CSV
            </button>
          </div>
        </div>

        {exportError && (
          <div className="st-alert" role="alert">
            <AlertCircle aria-hidden />
            <span>{exportError}</span>
          </div>
        )}
      </div>

      {/* table */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: "center" }} role="status" aria-label="Loading leads">
          <RefreshCw
            style={{
              width: 22,
              height: 22,
              margin: "0 auto 10px",
              color: "var(--accent-ink)",
              animation: "spin 1.2s linear infinite",
              display: "block",
            }}
            aria-hidden
          />
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)" }}>
            Loading captured leads…
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="st-empty">
          <div className="st-empty__icon">
            <Users aria-hidden />
          </div>
          <h3>No leads captured yet</h3>
          <p>
            When viewers comment your trigger keywords on active Reels, their profile and
            interaction data lands here automatically — follower-verified, export-ready.
          </p>
        </div>
      ) : (
        <div
          className="st-tablewrap"
          tabIndex={0}
          role="region"
          aria-label="Captured leads data table"
        >
          <table className="st-table">
            <caption className="sr-only">
              Captured Instagram leads, follower statuses, and interaction counts
            </caption>
            <thead>
              <tr>
                <th scope="col">Instagram User</th>
                <th scope="col">Follower Status</th>
                <th scope="col">Email Address</th>
                <th scope="col">DMs Sent</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={lead.id} style={{ ["--i" as string]: String(i) }}>
                  <th scope="row">
                    <div className="st-leadname">
                      <span
                        className={`st-leadavatar${!lead.followerStatusAtTrigger ? " st-leadavatar--paprika" : ""}`}
                        aria-hidden
                      >
                        {(lead.username || "U")[0].toUpperCase()}
                      </span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{lead.username ? `@${lead.username}` : "Anonymous"}</span>
                          {lead.username && (
                            <a
                              href={`https://instagram.com/${encodeURIComponent(lead.username)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--text-faint)" }}
                              title="View profile on Instagram"
                              aria-label={`View @${lead.username} on Instagram`}
                            >
                              <ExternalLink style={{ width: 12, height: 12 }} aria-hidden />
                            </a>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--text-faint)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ID: {lead.instagramScopedId.slice(0, 10)}…
                        </span>
                      </div>
                    </div>
                  </th>

                  <td>
                    {lead.followerStatusAtTrigger ? (
                      <span className="st-chip st-chip--follower">
                        <CheckCircle2 style={{ width: 11, height: 11 }} aria-hidden />
                        Follower
                      </span>
                    ) : (
                      <span className="st-chip st-chip--nonfollower">
                        <XCircle style={{ width: 11, height: 11 }} aria-hidden />
                        Non-follower
                      </span>
                    )}
                  </td>

                  <td>
                    {lead.emailCollected ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 700,
                        }}
                      >
                        <Mail
                          style={{ width: 13, height: 13, color: "var(--text-faint)" }}
                          aria-hidden
                        />
                        {lead.emailCollected}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-faint)" }}>—</span>
                    )}
                  </td>

                  <td style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                    {lead.totalDmsSent}
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--text-soft)",
                      fontSize: 11,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {new Date(lead.lastInteractionAt * 1000).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* pager */}
      {!isLoading && total > 0 && (
        <div className="st-pager" style={{ padding: "14px 20px", borderTop: "1.5px solid var(--border)" }}>
          <span className="st-pager__info">
            Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
            {total.toLocaleString()} contacts
          </span>
          <div className="st-pager__btns">
            <button
              type="button"
              className="st-btn st-btn--ghost st-btn--sm"
              onClick={() => goPage(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft aria-hidden /> Prev
            </button>
            <span
              className="st-pager__info"
              style={{ alignSelf: "center", fontVariantNumeric: "tabular-nums" }}
            >
              Page {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="st-btn st-btn--ghost st-btn--sm"
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next <ChevronRight aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
