import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import { formatDate, priorityClass, statusClass } from "../utils/format";

export const TicketCard = ({ ticket }) => (
  <Link
    to={`/tickets/${ticket._id}`}
    className="block border border-line bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-mint"
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-ink">{ticket.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/65">{ticket.description}</p>
      </div>
      <div className="flex gap-2">
        <Badge className={statusClass[ticket.status]}>{ticket.status}</Badge>
        <Badge className={priorityClass[ticket.priority]}>{ticket.priority}</Badge>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/55">
      <span>Customer: {ticket.customer?.name || "Unknown"}</span>
      <span>Updated {formatDate(ticket.updatedAt)}</span>
    </div>
  </Link>
);
