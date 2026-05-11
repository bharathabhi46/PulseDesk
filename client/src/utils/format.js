export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value))
    : "Not set";

export const humanize = (value = "") => value.replaceAll("_", " ");

export const priorityClass = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-sky-50 text-sky-700 border-sky-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200"
};

export const statusClass = {
  open: "bg-white text-ink border-line",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  waiting_on_customer: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-zinc-100 text-zinc-700 border-zinc-200"
};
