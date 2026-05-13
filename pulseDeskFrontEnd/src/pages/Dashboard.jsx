import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { MetricCard } from "../components/MetricCard";
import { TicketCard } from "../components/TicketCard";
import { useAuth } from "../context/AuthContext";

export const Dashboard = () => {
  const { isStaff } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const load = async () => {
      const ticketsRes = await http.get("/tickets");
      setTickets(ticketsRes.data.tickets);
      if (isStaff) {
        const analyticsRes = await http.get("/tickets/analytics");
        setAnalytics(analyticsRes.data.analytics);
      }
    };
    load();
  }, [isStaff]);

  const metrics = useMemo(() => {
    if (analytics) return analytics.totals;
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
      avgResponseMs: 0
    };
  }, [analytics, tickets]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total tickets" value={metrics.total || 0} />
        <MetricCard label="Open tickets" value={metrics.open || 0} tone="bg-mint/15" />
        <MetricCard label="Resolved" value={metrics.resolved || 0} tone="bg-white" />
        <MetricCard label="Avg response" value={metrics.avgResponseMs ? `${Math.round(metrics.avgResponseMs / 60000)}m` : "New"} tone="bg-amber/20" />
      </section>
      {analytics && (
        <section className="grid gap-4 lg:grid-cols-3">
          <Breakdown title="Status" data={analytics.byStatus} />
          <Breakdown title="Priority" data={analytics.byPriority} />
          <Breakdown title="Sentiment" data={analytics.bySentiment} />
        </section>
      )}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent tickets</h2>
        </div>
        <div className="space-y-3">
          {tickets.slice(0, 6).map((ticket) => <TicketCard key={ticket._id} ticket={ticket} />)}
          {!tickets.length && <p className="border border-line bg-white p-6 text-sm text-ink/60">No tickets yet.</p>}
        </div>
      </section>
    </div>
  );
};

const Breakdown = ({ title, data }) => (
  <div className="border border-line bg-white p-4 shadow-soft">
    <h3 className="font-semibold text-ink">{title}</h3>
    <div className="mt-4 space-y-3">
      {data.map((item) => (
        <div key={item._id || "none"} className="flex items-center justify-between text-sm">
          <span className="capitalize text-ink/65">{String(item._id || "none").replaceAll("_", " ")}</span>
          <span className="font-semibold text-ink">{item.count}</span>
        </div>
      ))}
    </div>
  </div>
);
