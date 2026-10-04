import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import LeadsTable from "@/components/dashboard/LeadsTable";
import { useDashboard } from "./DashboardContext";

export default function LeadsPage() {
  const { leads, leadsTotal, leadsPage, isLoadingLeads, leadsError, loadLeads, currentAccount } =
    useDashboard();
  const searchRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    loadLeads(undefined, 0);
  }, [loadLeads]);

  return (
    <div className="pg-page">
      <div className="pg-head">
        <div>
          <span className="hm-eyebrow">Leads</span>
          <h1 className="hm-title">
            Every commenter.
            <br />
            <em>Yours, forever.</em>
          </h1>
          <p className="pg-sub">
            {leadsTotal.toLocaleString()} contacts captured by your funnels. Export the full list
            as CSV any time — no contact tiers, no ransom.
          </p>
        </div>
      </div>

      {leadsError && (
        <div className="sh-alert" role="alert" style={{ marginBottom: 18 }}>
          <span>{leadsError}</span>
        </div>
      )}

      <LeadsTable
        leads={leads}
        total={leadsTotal}
        page={leadsPage}
        pageSize={25}
        isLoading={isLoadingLeads}
        onSearch={(q, page) => {
          searchRef.current = q;
          loadLeads(q, page);
        }}
        onExportCsv={async () => {
          await api.leads.downloadCsv(currentAccount?.id || "", currentAccount?.username);
        }}
      />
    </div>
  );
}
