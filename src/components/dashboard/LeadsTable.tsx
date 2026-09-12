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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CapturedLead } from "@/types/contracts";

interface LeadsTableProps {
  leads: CapturedLead[];
  total: number;
  isLoading: boolean;
  onSearch: (query: string) => void;
  onExportCsv: () => Promise<void>;
}

export default function LeadsTable({
  leads,
  total,
  isLoading,
  onSearch,
  onExportCsv,
}: LeadsTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportCsv();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden font-sans">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Captured Leads</h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {total} contacts
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            100% creator-owned database. Zero contact tax, zero platform lock-in.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search username or email..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white"
            />
          </form>

          {/* 1-Click CSV Export */}
          <Button
            onClick={handleExport}
            disabled={isExporting || total === 0}
            size="sm"
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shrink-0"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
          <p className="text-xs font-medium">Loading captured leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Leads Captured Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When users comment your trigger keyword on active Reels, their profile and interaction data will be captured here automatically.
          </p>
        </div>
      ) : (
        <div tabIndex={0} role="region" aria-label="Captured leads data table" className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-b-2xl">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <caption className="sr-only">
              Captured Instagram leads, follower statuses, and automated interaction telemetry
            </caption>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th scope="col" className="py-3 px-5">Instagram User</th>
                <th scope="col" className="py-3 px-5">Follower Status</th>
                <th scope="col" className="py-3 px-5">Email Address</th>
                <th scope="col" className="py-3 px-5 text-center">DMs Dispatched</th>
                <th scope="col" className="py-3 px-5 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                  <th scope="row" className="py-3.5 px-5 font-semibold text-slate-900 text-left font-normal">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-mono font-bold text-[10px] text-slate-600 uppercase shrink-0">
                        {(lead.username || "U")[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span>{lead.username ? `@${lead.username}` : "Anonymous"}</span>
                          {lead.username && (
                            <a
                              href={`https://instagram.com/${lead.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-sky-600 ml-0.5"
                              title="View profile on Instagram"
                              aria-label={`View @${lead.username} on Instagram`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          ID: {lead.instagramScopedId.slice(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </th>

                  <td className="py-3.5 px-5">
                    {lead.followerStatusAtTrigger ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Follower
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        Non-Follower
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5">
                    {lead.emailCollected ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {lead.emailCollected}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-800">
                    {lead.totalDmsSent}
                  </td>

                  <td className="py-3.5 px-5 text-right font-mono text-slate-500 text-[11px]">
                    {new Date(lead.lastInteractionAt * 1000).toLocaleDateString(undefined, {
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
    </div>
  );
}
