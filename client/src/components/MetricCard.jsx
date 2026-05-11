export const MetricCard = ({ label, value, tone = "bg-white" }) => (
  <div className={`${tone} border border-line p-4 shadow-soft`}>
    <p className="text-sm text-ink/60">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
  </div>
);
